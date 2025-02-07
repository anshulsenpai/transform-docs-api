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
  console.log('created uploads dir')
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-"); // ✅ Remove extra extensions
    cb(null, `${Date.now()}-${baseName}${ext}`); // ✅ Ensures single extension
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
