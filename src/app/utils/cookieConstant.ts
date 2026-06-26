export const refreshTokenCookieOptions = {
  httpOnly: true,

  secure: process.env.NODE_ENV === "production",

  sameSite: "strict" as const,

  path: "/",
};