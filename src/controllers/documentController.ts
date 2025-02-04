import { Response, NextFunction } from "express";
import {
  downloadFileService,
  getUserDocumentService,
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
      throw new CustomError("Unauthorized", 401);
    }

    const { name, description } = req.body;

    if (!name) {
      throw new CustomError("Document name is required", 400);
    }

    const result = await uploadDocumentService(
      req.file,
      req.user.userId,
      name,
      description
    );
    successResponse(res, result.message, result.document, 201);
  } catch (error) {
    next(error);
  }
};

export const getUserDocumentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new CustomError("Unauthorized", 401);
    }
    const documents = await getUserDocumentService(userId);
    successResponse(res, "User documents retrieved successfully!", documents);
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

export const downloadFileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req?.user?.userId;
    const { fileId } = req.params;

    if (!userId) {
      throw new CustomError("Unauthorized", 401);
    }

    if (!fileId) {
      throw new CustomError("File ID is required", 400);
    }

    // Get the file path from the service
    const filePath = await downloadFileService(fileId, userId);

    // Send file for download
    res.download(filePath, (err) => {
      if (err) {
        console.error("❌ Error in file download:", err);
        return next(new CustomError("Error downloading file", 500));
      }
    });
  } catch (error) {
    next(error);
  }
};
