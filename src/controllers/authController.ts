import { Request, Response, NextFunction } from "express";
import { loginUserService, registerUserService } from "../services/authService";
import { successResponse } from "../utils/httpResponse";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUserService(name, email, password);
    successResponse(res, result.message, result.user, 201);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const result = await loginUserService(email, password);
    successResponse(res, result.message, {
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};
