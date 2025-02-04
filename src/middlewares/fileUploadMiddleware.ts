import multer from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";
import { AuthRequest } from "../types/express";
import { CustomError } from "../utils/customError";

// ✅ Allowed file extensions
const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

// ✅ Define storage location dynamically
const storage = multer.diskStorage({
  destination: (req: AuthRequest, file, cb) => {
    const userId = req.user?.userId ?? "unknown"; // Use userId for organized storage
    const uploadPath = path.join(__dirname, "../../uploads", userId);

    // ✅ Create directory if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${file.fieldname}${ext}`); // Rename file
  },
});

// ✅ File Filter: Allow only specific file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new CustomError("Invalid file type. Only PDF, JPG, and PNG allowed!", 400)
    );
  }
  cb(null, true);
};

// ✅ Define limits (Max file size: 5MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export { upload };
