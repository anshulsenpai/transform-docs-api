import { Response, NextFunction } from "express";
import {
  downloadFileService,
  getAdminStatsService,
  getAllDocumentService,
  getSharedDocumentsService,
  getUserDocumentService,
  shareDocumentService,
  unshareDocumentService,
  uploadDocumentService,
} from "../services/documentService";
import { successResponse } from "../utils/httpResponse";
import { AuthRequest } from "../types/express";
import { CustomError } from "../utils/customError";
import Document, { IDocument } from "../models/Document";
import User from "../models/User";
import mongoose from "mongoose";
import Activity from "../models/Activity";

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

// In updateFraudStatusController
export const updateFraudStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { fraudStatus, fraudReason } = req.body;
    const adminId = req.user?.userId;

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
        verifiedBy: adminId, // From decoded JWT (admin)
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedDoc) {
      throw new CustomError("Document not found", 404);
    }

    // Add activity record for verification
    await new Activity({
      type: "verification",
      user: adminId,
      document: documentId,
      status: fraudStatus,
      details: fraudReason || `Document marked as ${fraudStatus}`,
    }).save();

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

// Controller for sharing documents
export const shareDocumentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    const { documentId, userIds, note } = req.body;

    if (!adminId) {
      throw new CustomError("Unauthorized", 401);
    }

    // Check if the requester is an admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      throw new CustomError("Only admins can share documents", 403);
    }

    if (
      !documentId ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      throw new CustomError(
        "Document ID and at least one user ID required",
        400
      );
    }

    // Share the document with users
    const result = await shareDocumentService(
      documentId,
      userIds,
      adminId,
      note
    );

    res.status(200).json({
      success: true,
      message: "Document shared successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Controller to get shared documents for a user
export const getSharedDocumentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new CustomError("Unauthorized", 401);
    }

    // Get shared documents for the user
    const documents = await getSharedDocumentsService(userId);

    res.status(200).json({
      success: true,
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSharedDocumentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verify the user is an admin (optional security check)
    const userId = req.user?.userId;
    if (userId) {
      const user = await User.findById(userId);
      if (!user || user.role !== "admin") {
        throw new CustomError(
          "Access denied: Only admins can view all shared documents",
          403
        );
      }
    }

    // Get all shared documents and populate all relevant user references
    const documents = await Document.find({ isShared: true })
      .populate("uploadedBy", "name email")
      .populate("sharedBy", "name email")
      .populate("sharedWith", "name email") // Added this line to populate sharedWith
      .sort({ sharedAt: -1 });

    res.status(200).json({
      success: true,
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
};

// Add route to handle unsharing documents
export const unshareDocumentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req?.user?.userId;
    const { documentId, userId } = req.body;

    if (!adminId) {
      throw new CustomError("Unauthorized", 401);
    }

    // Unshare the document from a specific user
    await unshareDocumentService(documentId, userId, adminId);

    res.status(200).json({
      success: true,
      message: "Document unshared successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Controller for getting recent activity
export const getRecentActivityController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new CustomError("Unauthorized", 401);
    }

    // Verify admin role
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      throw new CustomError(
        "Access denied: Only admins can view this data",
        403
      );
    }

    // Fetch recent activity - this query would depend on your schema
    // You might need to combine data from multiple collections
    const recentActivities = await Activity.find()
      .populate("user", "name email")
      .populate("document", "name filename category")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        activities: recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryStatsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new CustomError("Unauthorized", 401);
    }

    // Verify admin role
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      throw new CustomError(
        "Access denied: Only admins can view this data",
        403
      );
    }

    // Aggregate documents by category
    const categoryCounts = await Document.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Define category colors with proper typing
    const categoryColors: Record<string, string> = {
      "medical-record": "bg-blue-500",
      "id-card": "bg-purple-500",
      certificate: "bg-emerald-500",
      "bank-statement": "bg-amber-500",
      invoice: "bg-orange-500",
      "contract-agreement": "bg-pink-500",
      "salary-slip": "bg-indigo-500",
      unclassified: "bg-gray-500",
      // Add more categories as needed
    };

    // Format the response
    const categories = categoryCounts.map((cat) => {
      // Safe way to get category name with fallback
      const categoryName = cat._id ? String(cat._id) : "Unclassified";

      // Safe way to get color
      const color =
        categoryName in categoryColors
          ? categoryColors[categoryName]
          : "bg-gray-500";

      return {
        name: categoryName,
        value: cat.count,
        color: color,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};
