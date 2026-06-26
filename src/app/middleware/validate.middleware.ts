// import { ZodObject } from "zod"
// import{ NextFunction, Request, Response } from "express"




// export const validateSchma = (zodSchema: ZodObject<any>) => async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     let parsedBody: any = {};

//     if (req.body && req.body.data) {
//       try {
//         parsedBody = JSON.parse(req.body.data);
//       } catch (err) {
//         return res.status(400).json({ message: "Invalid JSON in data field" });
//       }
//     } else {
//       parsedBody = req.body || {};
//     }

   
//     req.body = await zodSchema.parseAsync(parsedBody);

//     next();
//   } catch (err) {
//     next(err);
//   }
// };

  
import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

type ValidationTarget = "body" | "query" | "params";

export const validateSchma =
  (
    schema: ZodTypeAny,
    target: ValidationTarget = "body"
  ) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let data: unknown;

      switch (target) {
        case "body":
          if (req.body?.data) {
            try {
              data = JSON.parse(req.body.data);
            } catch {
              return res.status(400).json({
                success: false,
                message: "Invalid JSON in data field",
              });
            }
          } else {
            data = req.body;
          }
          break;

        case "query":
          data = req.query;
          break;

        case "params":
          data = req.params;
          break;
      }

      const validatedData = await schema.parseAsync(data);

      switch (target) {
        case "body":
          req.body = validatedData;
          break;
        case "query":
          (req.query as any) = validatedData;
          break;
        case "params":
          (req.params as any) = validatedData;
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };