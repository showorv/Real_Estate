import z from "zod";

export const updateProfileSchema =
  z.object({
    
      name:
        z.string().min(2).optional(),

      avatar:
        z.url().optional(),
    
  });