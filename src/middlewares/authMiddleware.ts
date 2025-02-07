import { Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { CustomError } from "../utils/customError";
import { AuthRequest } from "../types/express";

const JWT_SECRET = process.env.JWT_SECRET ?? "your_jwt_secret";

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    throw new CustomError("Access denied, no token provided", 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new CustomError("Token expired, please login again", 401);
    }
    throw new CustomError("Invalid token", 403);
  }
};
