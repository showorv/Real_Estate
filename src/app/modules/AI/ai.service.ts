import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { env } from '../../config/env';

import * as propertyService from '../property/property.service';
import { IProperty } from '../property/property.interface';

import {
  GenerateDescriptionInput,
  GetRecommendationsInput,
  RecommendationHistoryQuery,
  IAIRecommendation,
  recommendationResponseSchema,
} from './ai.interface';
import { AppError } from '../../utils/apiError';
import { HTTP_STATUS } from '../../constraints/httpStatus';
import { AuthUser } from '../../constraints/user';
import { AIRecommendationModel } from './recomendatiion.model';
import { NeighborhoodAnalysisModel } from './neighbourHoodAnalysis.mode';

// Lazily constructed -- the SDK's constructor throws synchronously if no
// apiKey is present, and this module is imported as part of app.ts's route
// chain. Constructing it eagerly at module scope would crash the entire
// server on boot whenever OPENAI_API_KEY isn't set yet, rather than letting
// withAIFallback degrade gracefully only when an AI route is actually hit
// (same "server boots fine without it" pattern as Google OAuth's
// isConfigured flag in config/env.ts).
let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.openai.apiKey) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'AI features are not configured on this server yet');
  }
  // A 20s timeout + a single re.try caps the worst-case latency of any one AI
  // call to ~40s instead of the SDK's 10-minute default -- a slow/hanging
  // OpenAI call should never hang a request indefinitely.
  client ??= new OpenAI({ apiKey: env.openai.apiKey, timeout: 20_000, maxRetries: 1 });
  return client;
}

const NEIGHBORHOOD_CACHE_TTL_DAYS = 30;

/**
 * Every OpenAI call in this service goes through here. Translates
 * timeouts/API errors into a clean 503 rather than letting a raw SDK error
 * (or a hung request) reach the client -- the "don't let a slow LLM call
 * block the UI" risk called out in the plan.
 */
async function withAIFallback<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof OpenAI.APIError || err instanceof OpenAI.APIConnectionTimeoutError) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, 'AI service is temporarily unavailable, please try again shortly');
    }
    throw err;
  }
}

/** Condensed shape fed to the model -- full description/images would burn tokens for no benefit. */
function condenseProperty(property: IProperty) {
  return {
    id: property._id.toString(),
    title: property.title,
    propertyType: property.propertyType,
    listingType: property.listingType,
    price: property.price,
    currency: property.currency,
    city: property.location.city,
    area: property.location.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft,
    ratingAvg: property.ratingAvg,
  };
}

// ---------------------------------------------------------------------------
// Feature 1: AI Property Description Generator
// ---------------------------------------------------------------------------

/** Pure generation, no DB write -- the manager edits the result before the listing is ever saved. */
export async function generateDescription(input: GenerateDescriptionInput): Promise<string> {
  return withAIFallback(async () => {
    const response = await getClient().responses.create({
      model: env.openai.model,
      instructions:
        'You write polished, factual real-estate marketing descriptions. ' +
        '150-220 words, no markdown, no emojis, no invented amenities or claims ' +
        'beyond the facts given. Confident and inviting tone.',
      input: JSON.stringify({
        title: input.title,
        propertyType: input.propertyType,
        listingType: input.listingType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        areaSqft: input.areaSqft,
        price: input.price,
        currency: input.currency ?? 'USD',
        city: input.city,
        area: input.area,
        amenities: input.amenities ?? [],
      }),
    });

    const text = response.output_text?.trim();
    if (!text) throw new AppError(HTTP_STATUS.FORBIDDEN, 'AI did not return a description, please try again');
    return text;
  });
}

// ---------------------------------------------------------------------------
// Feature 2: AI Smart Recommendations
// ---------------------------------------------------------------------------

interface RecommendationResult {
  recommendationText: string;
  properties: IProperty[];
  tokensUsed?: number;
}

/**
 * Shortlist-then-rerank, never the whole DB fed to the model:
 * - propertyId given  -> reuse property.service's same-city/type related
 *   listings as the candidate pool ("similar to what you're viewing").
 * - prompt only        -> recent approved listings as the candidate pool
 *   (a genuine "viewed/saved history" personalization signal doesn't exist
 *   yet -- favorites was descoped, see the plan's known-gaps list -- so this
 *   is honestly attribute/recency-based, not yet personalized to the user).
 * The LLM then picks and ranks a subset of that shortlist and explains why.
 */
export async function getRecommendations(
  actor: AuthUser,
  input: GetRecommendationsInput
): Promise<RecommendationResult> {
  let shortlist: IProperty[];
  let sourceProperty: IProperty | undefined;

  if (input.propertyId) {
    sourceProperty = await propertyService.getApprovedPropertyById(input.propertyId);
    shortlist = await propertyService.getRelatedProperties(input.propertyId, 10);
  } else {
    const page = await propertyService.listProperties({ limit: 20, sort: 'newest' ,page:1});
    shortlist = page.properties;
  }

  if (shortlist.length === 0) {
    return { recommendationText: 'No properties are available to recommend right now.', properties: [] };
  }

  const promptText =
    input.prompt ?? (sourceProperty ? `Properties similar to "${sourceProperty.title}"` : 'Recent listings');

  const { recommendationText, tokensUsed, recommendedIds } = await withAIFallback(async () => {
    const response = await getClient().responses.create({
      model: env.openai.model,
      instructions:
        'You are a real-estate recommendation assistant. You will be given a ' +
        "shortlist of candidate properties (JSON) and the user's request. Pick " +
        'the best-matching subset (most relevant first, at most 6) and write a ' +
        'short (2-4 sentence) explanation of why they fit. Only use ids that ' +
        'appear in the candidate list -- never invent one.',
      input: JSON.stringify({
        userRequest: promptText,
        candidates: shortlist.map(condenseProperty),
      }),
      text: { format: zodTextFormat(recommendationResponseSchema, 'recommendation') },
    });

    const text = response.output_text;
    if (!text) throw new AppError(HTTP_STATUS.FORBIDDEN, 'AI did not return any recommendations, please try again');

    const parsed = recommendationResponseSchema.parse(JSON.parse(text));
    return {
      recommendationText: parsed.recommendationText,
      tokensUsed: response.usage?.total_tokens,
      recommendedIds: parsed.recommendedPropertyIds,
    };
  });

  // Safety net: only trust ids that were actually in the candidate list the
  // model was given, in case it hallucinates one anyway despite the prompt.
  let recommended = shortlist.filter((p) => recommendedIds.includes(p._id.toString()));
  if (recommended.length === 0) {
    recommended = shortlist.slice(0, Math.min(4, shortlist.length));
  }

  await AIRecommendationModel.create({
    userId: actor.userId,
    propertyId: sourceProperty?._id,
    prompt: promptText,
    recommendedPropertyIds: recommended.map((p) => p._id),
    recommendationText,
    aiModel: env.openai.model,
    tokensUsed,
  });

  return { recommendationText, properties: recommended, tokensUsed };
}

interface PaginatedResult<T> {
  history: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** "My recommendation history" -- the user's own usage log, newest first. */
export async function getRecommendationHistory(
  actor: AuthUser,
  query: RecommendationHistoryQuery
): Promise<PaginatedResult<IAIRecommendation>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const filter = { userId: actor.userId };

  const [history, total] = await Promise.all([
    AIRecommendationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('recommendedPropertyIds', 'title slug images price currency')
      .populate('propertyId', 'title slug'),
    AIRecommendationModel.countDocuments(filter),
  ]);

  return { history, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// ---------------------------------------------------------------------------
// Feature 3: AI Neighborhood Analysis (get-or-generate, cached)
// ---------------------------------------------------------------------------

/**
 * Classic get-or-generate cache: serves the cached write-up if it exists,
 * isn't expired, and was generated for the property's *current* location.
 * Only calls OpenAI on a miss or a stale/relocated entry.
 */
export async function getNeighborhoodAnalysis(propertyId: string): Promise<string> {
  const property = await propertyService.getApprovedPropertyById(propertyId);
  const { city, area } = property.location;

  const cached = await NeighborhoodAnalysisModel.findOne({ propertyId });
  const isFresh = cached && cached.expiresAt > new Date();
  const isSameLocation =
    cached && cached.locationSnapshot.city === city && cached.locationSnapshot.area === area;

  if (cached && isFresh && isSameLocation) {
    return cached.analysis;
  }

  const analysis = await withAIFallback(async () => {
    const response = await getClient().responses.create({
      model: env.openai.model,
      instructions:
        'You write short, useful neighborhood breakdowns for real-estate listings. ' +
        'Cover schools, transit/commute, walkability, and general vibe in 4 short ' +
        'paragraphs or a tight bulleted list. Speak generally and plausibly about the ' +
        "area given only its city/area name -- don't invent specific named schools, " +
        'street names, or addresses you cannot actually know.',
      input: JSON.stringify({ city, area }),
    });

    const text = response.output_text?.trim();
    if (!text) throw new AppError(HTTP_STATUS.FORBIDDEN, 'AI did not return an analysis, please try again');
    return text;
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + NEIGHBORHOOD_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await NeighborhoodAnalysisModel.findOneAndUpdate(
    { propertyId },
    {
      propertyId,
      analysis,
      aiModel: env.openai.model,
      locationSnapshot: { city, area },
      generatedAt: now,
      expiresAt,
    },
    { upsert: true }
  );

  return analysis;
}