import express from "express";
import { upload } from "../middlewares/fileUploadMiddleware";
import {
  uploadDocument,
  verifyDocument,
} from "../controllers/documentController";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.post("/verify", verifyDocument);

export default router;
