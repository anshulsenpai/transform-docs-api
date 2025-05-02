import express from "express";
import { upload } from "../middlewares/fileUploadMiddleware";
import {
  dashboardStats,
  downloadFileController,
  getAllDocumentsController,
  getUserDocumentsController,
  updateFraudStatusController,
  uploadDocument,
} from "../controllers/documentController";
import { isAdmin } from "../middlewares/roleMiddleware";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/get-document", getUserDocumentsController);
router.get("/get-all-document", getAllDocumentsController);
router.get("/download/:fileId", downloadFileController);

// admin routes
router.get("/dashboard-stats", isAdmin, dashboardStats);

router.put(
  "/update-fraud-status/:documentId",
  isAdmin,
  updateFraudStatusController
);

export default router;
