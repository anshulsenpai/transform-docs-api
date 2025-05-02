import { Response, NextFunction } from "express";
import {
  downloadFileService,
  getAdminStatsService,
  getAllDocumentService,
  getUserDocumentService,
  uploadDocumentService,
} from "../services/documentService";
import { successResponse } from "../utils/httpResponse";
import { AuthRequest } from "../types/express";
import { CustomError } from "../utils/customError";
import Document from "../models/Document";

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
    const { searchQuery, category } = req.query;
    const documents = await getUserDocumentService(
      userId,
      searchQuery as string,
      category as string
    );
    successResponse(res, "User documents retrieved successfully!", {
      documents,
      totalDocs: documents.length,
    });
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

export const dashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    try {
      const stats = await getAdminStatsService();
      successResponse(res, "Admin statistics retrieved successfully", stats);
    } catch (err) {
      next(err);
    }
  } catch (error) {
    next(error);
  }
};

export const updateFraudStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { fraudStatus, fraudReason } = req.body;

    // Validate input
    const validStatuses = ["pending", "suspicious", "verified", "rejected"];
    if (!validStatuses.includes(fraudStatus)) {
      throw new CustomError(
        `Invalid fraud status. Allowed: ${validStatuses.join(", ")}`,
        400
      );
    }

    // Update document
    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      {
        fraudStatus,
        fraudReason: fraudReason || undefined,
        verifiedBy: req.user?.userId, // From decoded JWT (admin)
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedDoc) {
      throw new CustomError("Document not found", 404);
    }

    successResponse(res, "Fraud status updated successfully", {
      document: updatedDoc,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDocumentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const { searchQuery, category } = req.query;
    const documents = await getAllDocumentService(
      searchQuery as string,
      category as string
    );
    successResponse(res, "User documents retrieved successfully!", {
      documents,
      totalDocs: documents.length,
    });
  } catch (error) {
    next(error);
  }
};
