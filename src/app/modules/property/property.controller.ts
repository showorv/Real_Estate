import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";

import * as propertyService from "./property.service";
import { sendResponse } from "../../utils/sendResponse";
import { HTTP_STATUS } from "../../constraints/httpStatus";
import { requireParam } from "../../utils/requireParam";

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  const result = await propertyService.listProperties(req.query as never);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Properties fetched",
    data: result.properties,
    meta: result.pagination,
  });
});

export const getMyProperties = asyncHandler(async (req: Request, res: Response) => {

    const userId = (req.user as any).userId;
  const result = await propertyService.getMyProperties(userId, req.query as never);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Your properties fetched",
    data: result.properties,
    meta: result.pagination,
  });
});

export const getModerationQueue = asyncHandler(async (req: Request, res: Response) => {
  const result = await propertyService.getModerationQueue(req.query as never);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Moderation queue fetched",
    data: result.properties,
    meta: result.pagination,
  });
});

export const getPropertyBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = requireParam(req.params.slug, "slug");
  const property = await propertyService.getPropertyBySlug(slug, req.user as any);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Property fetched",
    data: property,
  });
});

export const getRelatedProperties = asyncHandler(async (req: Request, res: Response) => {
    
    const id = requireParam(req.params.id, "id");
  const related = await propertyService.getRelatedProperties(id);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Related properties fetched",
    data: related,
  });
});

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).userId;
  const property = await propertyService.createProperty(userId, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: "Property submitted for review",
    data: property,
  });
});

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const property = await propertyService.updateProperty(id, req.user! as any, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Property updated",
    data: property,
  });
});

export const updatePropertyStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  const property = await propertyService.updatePropertyStatus(id, req.body.status);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: `Property ${req.body.status}`,
    data: property,
  });
});

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, "id");
  await propertyService.deleteProperty(id, req.user! as any);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Property deleted",
    data: null,
  });
});