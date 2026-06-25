import { ZodObject } from "zod"
import{ NextFunction, Request, Response } from "express"




export const validateSchma = (zodSchema: ZodObject<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    let parsedBody: any = {};

    if (req.body && req.body.data) {
      try {
        parsedBody = JSON.parse(req.body.data);
      } catch (err) {
        return res.status(400).json({ message: "Invalid JSON in data field" });
      }
    } else {
      parsedBody = req.body || {};
    }

   
    req.body = await zodSchema.parseAsync(parsedBody);

    next();
  } catch (err) {
    next(err);
  }
};

  