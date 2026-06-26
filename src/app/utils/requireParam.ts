// import { HTTP_STATUS } from "../constraints/httpStatus";
// import { AppError } from "./apiError";

// export const requireParam = (
//   value: string | undefined,
//   paramName: string
// ): string => {
//   if (!value?.trim()) {
//     throw new AppError(
//       HTTP_STATUS.BAD_REQUEST,
//       `${paramName} is required`
//     );
//   }

//   return value;
// };

import { HTTP_STATUS } from "../constraints/httpStatus";
import { AppError } from "./apiError";

export const requireParam = (
  value: string | string[] | undefined,
  paramName: string
): string => {
  if (Array.isArray(value)) {
    if (value.length === 0 || !value[0]?.trim()) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        `${paramName} is required`
      );
    }

    return value[0];
  }

  if (!value?.trim()) {
    throw new AppError(
      HTTP_STATUS.BAD_REQUEST,
      `${paramName} is required`
    );
  }

  return value;
};