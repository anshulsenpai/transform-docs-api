import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/customError";

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
