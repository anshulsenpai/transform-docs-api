import { Response, NextFunction } from "express";
import {
  uploadDocumentService,
  verifyDocumentService,
} from "../services/documentService";
import { successResponse } from "../utils/httpResponse";
import { AuthRequest } from "../types/express";
import { CustomError } from "../utils/customError";

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new CustomError("No file uploaded", 400);
    }

    if (!req.user) {
      throw new CustomError("User not authenticated", 401);
    }

    const result = await uploadDocumentService(req.file, req.user.userId);
    successResponse(res, result.message, result.document, 201);
  } catch (error) {
    next(error);
  }
};

export const verifyDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fileHash } = req.body;
    if (!fileHash) {
      throw new CustomError("fileHash is required for verification", 400);
    }

    const result = await verifyDocumentService(fileHash);
    successResponse(res, result.message, result.document);
  } catch (error) {
    next(error);
  }
};
