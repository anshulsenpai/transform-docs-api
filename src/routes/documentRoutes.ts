import express from "express";
import { upload } from "../middlewares/fileUploadMiddleware";
import {
  downloadFileController,
  getUserDocumentsController,
  uploadDocument,
  verifyDocument,
} from "../controllers/documentController";
import { isAdmin } from "../middlewares/roleMiddleware";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.post("/verify", isAdmin, verifyDocument);
router.get("/get-document", getUserDocumentsController);
router.get("/download/:fileId", downloadFileController);

export default router;
