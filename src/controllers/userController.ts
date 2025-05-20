import { Response, NextFunction } from "express";
import User from "../models/User";
import { CustomError } from "../utils/customError";
import { AuthRequest } from "../types/express";

// Controller to get all users
export const getAllUsersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requesterId = req.user?.userId;

    if (!requesterId) {
      throw new CustomError("Unauthorized", 401);
    }

    // Check if the requester is an admin
    const requester = await User.findById(requesterId);
    if (!requester) {
      throw new CustomError("User not found", 404);
    }

    // Only admins can get the full list of users
    // For regular users, just return a 403 or an empty list
    if (requester.role !== "admin") {
      throw new CustomError(
        "Access denied: Only admins can access user list",
        403
      );
    }

    // Get all users, excluding sensitive fields like password
    const users = await User.find({})
      .select("_id name email gender role")
      .sort({ name: 1 }); // Sort by name

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};
