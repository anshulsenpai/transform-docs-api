import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express";
import { CustomError } from "../utils/customError";

// ✅ Middleware to check if the user is an admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new CustomError("Unauthorized", 401);
  }

  if (req.user.role !== "admin") {
    throw new CustomError("Forbidden: Admin access required", 403);
  }

  next(); // ✅ Proceed if admin
};
