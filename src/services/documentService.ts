import crypto from "crypto";
import fs from "fs/promises"; // ✅ Use async file operations
import path from "path";
import poppler from "pdf-poppler";
import Tesseract from "tesseract.js";
import Document from "../models/Document";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { CustomError } from "../utils/customError";

/**
 * Determines document category, class, and subject based on **filename and extracted text**.
 */
const classifyDocument = async (
  filename: string,
  extractedText: string
): Promise<{ category: string; class?: string; subject?: string }> => {
  const lowerCaseName = filename.toLowerCase();
  extractedText = extractedText.toLowerCase();

  // Try to classify based on the filename first
  if (lowerCaseName.includes("question") || lowerCaseName.includes("paper")) {
    return { category: "question-paper" };
  }

  if (lowerCaseName.includes("notice")) {
    return { category: "notice" };
  }

  if (lowerCaseName.includes("notification")) {
    return { category: "notification" };
  }

  // If no match from filename, use extracted text
  console.log(
    "🔍 No match in filename. Using OCR extracted text for classification..."
  );

  if (extractedText.includes("question paper")) {
    return { category: "question-paper" };
  }

  if (extractedText.includes("notice")) {
    return { category: "notice" };
  }

  if (extractedText.includes("notification")) {
    return { category: "notification" };
  }

  throw new CustomError("Unable to classify document", 400);
};

/**
 * Extracts text from an image or scanned document using Tesseract.js.
 */
const extractTextFromImage = async (filePath: string): Promise<string> => {
  try {
    console.log(`🔍 Extracting text from: ${filePath}`);

    // 🔹 Convert PDF to Image if it's a PDF file
    if (filePath.endsWith(".pdf")) {
      console.log("🔄 Converting PDF to Image for OCR...");
      const imagePath = await convertPdfToImage(filePath);
      console.log(`🖼 PDF converted to image: ${imagePath}`);

      // Perform OCR on the converted image
      filePath = imagePath;
    }

    // 🔹 Run OCR on Image
    const { data } = await Tesseract.recognize(filePath, "eng");
    return data.text || "OCR Extraction Failed";
  } catch (error) {
    console.error("❌ Failed to extract text using OCR:", error);
    return "OCR Extraction Failed"; // ✅ Return fallback text instead of throwing error
  }
};

/**
 * Converts a PDF file to an image (PNG) using pdf-poppler.
 */
const convertPdfToImage = async (pdfPath: string): Promise<string> => {
  try {
    console.log(`🔄 Converting PDF to image: ${pdfPath}`);

    const outputDir = path.dirname(pdfPath);
    const outputBaseName = path.basename(pdfPath, ".pdf");

    // Convert PDF to Image
    const opts = {
      format: "png" as "png",
      out_dir: outputDir,
      out_prefix: outputBaseName,
      page: 1, // Convert only the first page
    };

    await poppler.convert(pdfPath, opts);

    // Wait for image to be fully generated
    const imageFiles = await fs.readdir(outputDir);
    const generatedImage = imageFiles.find(
      (file) => file.startsWith(outputBaseName) && file.endsWith(".png")
    );

    if (!generatedImage) {
      throw new Error(
        `❌ PDF was converted, but no image was found in ${outputDir}`
      );
    }

    const finalImagePath = path.join(outputDir, generatedImage);
    console.log(`🖼 PDF successfully converted to image: ${finalImagePath}`);

    return finalImagePath;
  } catch (error) {
    console.error("❌ Failed to convert PDF to image:", error);
    throw new Error("PDF to Image conversion failed");
  }
};

/**
 * Uploads a document: Stores in the filesystem, saves metadata in MongoDB, and extracts text.
 */
export const uploadDocumentService = async (
  file: Express.Multer.File,
  userId: string
) => {
  try {
    console.log("📂 Upload request received");

    // Compute document hash
    const fileBuffer = await fs.readFile(file.path);
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Check if document already exists
    const existingDoc = await Document.findOne({ hash });
    if (existingDoc) {
      throw new CustomError(RESPONSE_MESSAGES.DOCUMENT_EXISTS, 400);
    }

    // Extract text from file (OCR)
    let extractedText = await extractTextFromImage(file.path);

    console.log("🔍 Extracted text:", extractedText.substring(0, 100)); // ✅ Log first 100 chars only

    // Classify the document based on filename AND extracted text
    const classification = await classifyDocument(
      file.originalname,
      extractedText
    );

    // Ensure directory exists
    const uploadDir = path.join(
      __dirname,
      "../../uploads",
      classification.category || "unclassified"
    );
    await fs.mkdir(uploadDir, { recursive: true });

    // Rename file to a unique format (timestamp + original filename)
    const finalFilename = `${Date.now()}-${file.originalname.replace(
      /\s+/g,
      "-"
    )}`;
    const finalFilePath = path.join(uploadDir, finalFilename);

    await fs.rename(file.path, finalFilePath);

    console.log(`📂 File saved at: ${finalFilePath}`);

    // Save document metadata in MongoDB
    const newDocument = await Document.create({
      filename: finalFilename,
      hash,
      path: finalFilePath,
      category: classification.category,
      class: classification.class,
      subject: classification.subject,
      extractedText, // ✅ Always a valid string
      uploadedBy: userId,
    });

    console.log(`✅ Document metadata saved in MongoDB: ${newDocument._id}`);

    return {
      message: RESPONSE_MESSAGES.DOCUMENT_UPLOADED,
      document: newDocument,
    };
  } catch (error: any) {
    console.error("❌ Error in uploadDocumentService:", error);
    throw new CustomError(
      RESPONSE_MESSAGES.ERROR_UPLOADING + ": " + error.message,
      500
    );
  }
};

/**
 * Verifies if a document is authentic by checking its hash.
 */
export const verifyDocumentService = async (fileBuffer: Buffer) => {
  try {
    console.log("🔍 Verifying document...");

    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const document = await Document.findOne({ hash });
    if (!document) {
      console.log("❌ Document not found.");
      throw new CustomError(RESPONSE_MESSAGES.DOCUMENT_NOT_FOUND, 404);
    }

    console.log(`✅ Document found: ${document._id}`);

    return { message: RESPONSE_MESSAGES.DOCUMENT_AUTHENTIC, document };
  } catch (error: any) {
    console.error("❌ Error in verifyDocumentService:", error);
    throw new CustomError(
      RESPONSE_MESSAGES.ERROR_VERIFICATION + ": " + error.message,
      500
    );
  }
};
