import express from "express";
import { upload } from "../middlewares/fileUploadMiddleware";
import {
  dashboardStats,
  downloadFileController,
  getAllDocumentsController,
  getAllSharedDocumentsController,
  getCategoryStatsController,
  getSharedDocumentsController,
  getUserDocumentsController,
  shareDocumentController,
  unshareDocumentController,
  updateFraudStatusController,
  uploadDocument,
} from "../controllers/documentController";
import { isAdmin } from "../middlewares/roleMiddleware";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/get-document", getUserDocumentsController);
router.get("/get-all-document", getAllDocumentsController);
router.get("/download/:fileId", downloadFileController);

// admin routes
router.get("/dashboard-stats", isAdmin, dashboardStats);

router.post("/share-document", isAdmin, shareDocumentController);
router.get("/get-shared-document", authenticateJWT, getSharedDocumentsController);
router.post("/unshare-document", isAdmin, unshareDocumentController);
router.get("/all-shared-documents", isAdmin, getAllSharedDocumentsController);
router.get("/recent-activities", isAdmin, getAllSharedDocumentsController);
router.get("/category-stats", isAdmin, getCategoryStatsController);

router.put(
  "/update-fraud-status/:documentId",
  isAdmin,
  updateFraudStatusController
);

export default router;
