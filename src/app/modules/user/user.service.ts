import { HTTP_STATUS } from "../../constraints/httpStatus";
import { AppError } from "../../utils/apiError";
import { User } from "./user.model";

const getMe = async (
  userId: string
) => {
  const user =
    await User.findById(userId);

  if (!user) {
    throw new AppError(
      HTTP_STATUS.NOT_FOUND,
      "User not found"
    );
  }

  return user;
};

const updateMe = async (
  userId: string,
  payload: {
    name?: string;
    avatar?: string;
  }
) => {
  const user =
    await User.findByIdAndUpdate(
      userId,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

  if (!user) {
    throw new AppError(
      HTTP_STATUS.NOT_FOUND,
      "User not found"
    );
  }

  return user;
};

export const UserService = {
  getMe,
  updateMe,
};