import multer from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";
import { CustomError } from "../utils/customError";

// ✅ Allowed file extensions
const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

// ✅ Define consistent storage directory
const uploadDir = path.join(__dirname, "../../uploads");

// ✅ Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // ✅ Always save in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedFilename = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${sanitizedFilename}${ext}`); // ✅ Prevents duplicate filenames
  },
});

// ✅ File Filter: Validate file type **before saving**
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
