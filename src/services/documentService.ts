import natural from "natural";
import { TfIdf } from "natural";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import poppler from "pdf-poppler";
import Tesseract from "tesseract.js";
import Document, { IDocument } from "../models/Document";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { CustomError } from "../utils/customError";
import { CATEGORIES } from "../constants/categories";
import { runFraudChecks } from "../utils/fraudDetection";
import User from "../models/User";
import mongoose from "mongoose";
import Activity from "../models/Activity";

const tokenizer = new natural.WordTokenizer();

const classifyDocument = async (
  filename: string,
  extractedText: string
): Promise<{ category: string; confidence: number }> => {
  const lowerCaseName = filename.toLowerCase();
  const lowerCaseText = extractedText.toLowerCase();

  const filenameCategory = getFilenameCategory(lowerCaseName);
  if (filenameCategory) {
    return { category: filenameCategory, confidence: 0.8 };
  }

  const textCategory = getTextCategory(lowerCaseText);
  if (textCategory) {
    return { category: textCategory, confidence: 0.6 };
  }
  const tfidf = new TfIdf();

  const tokens = tokenizer.tokenize(lowerCaseText);

  const filteredTokens = tokens.filter((token: any) => token.length > 2);

  tfidf.addDocument(filteredTokens);

  const scores = Object.entries(CATEGORIES).map(([category, features]) => {
    let score = 0;

    features.keywords.forEach((keyword) => {
      const keywordScore = tfidf.tfidf(keyword, 0);
      score += keywordScore;
      if (filteredTokens.includes(keyword)) {
        score += 3;
      }
    });

    features.keyPhrases.forEach((phrase) => {
      if (lowerCaseText.includes(phrase.toLowerCase())) {
        score += 10;

        const phraseTokens = tokenizer.tokenize(phrase.toLowerCase());
        const matchingTokens = phraseTokens.filter(
          (token: any) => filteredTokens.includes(token) && token.length > 3
        );

        if (matchingTokens.length > 1) {
          score += matchingTokens.length * 2;
        }
      }
    });

    return { category, score };
  });

  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0 || scores[0].score < 5) {
    console.log("⚠️ Low confidence classification, marking as unclassified");
    return { category: "unclassified", confidence: 0 };
  }

  const topScore = scores[0].score;
  const confidence = Math.min(topScore / 50, 1);

  return {
    category: scores[0].category,
    confidence,
  };
};

function getFilenameCategory(filename: any) {
  if (/question|paper|exam/i.test(filename)) return "question-paper";
  if (/notice|competetion|feedback|form|announcement/i.test(filename))
    return "notice";
  if (/notification|circular/i.test(filename)) return "notification";
  if (/scorecard|marksheet/i.test(filename)) return "score-card";
  if (
    /certificate|diploma|degree|medical-cert|medical\s*certificate/i.test(
      filename
    )
  )
    return "certificate";
  if (/invoice|bill|receipt/i.test(filename)) return "invoice";
  if (/id card|passport|aadhar|pan card/i.test(filename)) return "id-card";
  if (/prescription|medical record|lab report/i.test(filename))
    return "medical-record";
  if (/bank\s*statement|account\s*summary/i.test(filename))
    return "bank-statement";
  if (/report|business report|project report/i.test(filename)) return "report";
  if (/hall ticket|admit card/i.test(filename)) return "admit-card";
  if (/contract|agreement|nda/i.test(filename)) return "contract-agreement";
  if (/payslip|salary statement/i.test(filename)) return "salary-slip";
  return null;
}

function getTextCategory(text: any) {
  if (text.includes("exam paper") || text.includes("test questions"))
    return "question-paper";
  if (text.includes("important notice") || text.includes("public announcement"))
    return "notice";
  if (
    text.includes("government notification") ||
    text.includes("official circular")
  )
    return "notification";
  if (
    text.includes("academic transcript") ||
    text.includes("statement of marks") ||
    text.includes("marksheet")
  )
    return "score-card";
  if (
    text.includes("certificate of completion") ||
    text.includes("degree awarded")
  )
    return "certificate";
  if (text.includes("invoice number") || text.includes("total due"))
    return "invoice";
  if (text.includes("identity card") || text.includes("passport number"))
    return "id-card";
  if (text.includes("medical prescription") || text.includes("patient record"))
    return "medical-record";
  if (
    text.includes("account balance") ||
    text.includes("account summary") ||
    text.includes("bank statement")
  )
    return "bank-statement";
  if (text.includes("business report") || text.includes("financial summary"))
    return "report";
  if (text.includes("admit card") || text.includes("hall ticket"))
    return "admit-card";
  if (
    text.includes("contract terms") ||
    text.includes("non-disclosure agreement")
  )
    return "contract-agreement";
  if (text.includes("salary slip") || text.includes("monthly pay statement"))
    return "salary-slip";
  return null;
}

/**
 * Extracts text from an image or scanned document using Tesseract.js.
 * Keeping the existing implementation
 */
const extractTextFromImage = async (filePath: string): Promise<string> => {
  try {
    console.log(`🔍 Extracting text from: ${filePath}`);
    let isTempFile = false;

    // 🔹 Convert PDF to Image if it's a PDF file
    if (filePath.endsWith(".pdf")) {
      console.log("🔄 Converting PDF to Image for OCR...");
      const imagePath = await convertPdfToImage(filePath);
      console.log(`🖼 PDF converted to image: ${imagePath}`);
      isTempFile = true;
      // Perform OCR on the converted image
      filePath = imagePath;
    }

    // 🔹 Run OCR on Image
    const { data } = await Tesseract.recognize(filePath, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    if (isTempFile) {
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted temporary image: ${filePath}`);
    }
    return data.text || "OCR Extraction Failed";
  } catch (error) {
    console.error("❌ Failed to extract text using OCR:", error);
    return "OCR Extraction Failed"; // ✅ Return fallback text instead of throwing error
  }
};

/**
 * Converts a PDF file to an image (PNG) using pdf-poppler.
 * Keeping the existing implementation
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
 * Modified to include confidence score but keeping core functionality the same
 */
export const uploadDocumentService = async (
  file: Express.Multer.File,
  userId: string,
  name: string,
  description?: string
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

    console.log("🔍 Extracted text:", extractedText.substring(0, 300)); // ✅ Log first 300 chars only

    // Classify the document based on filename AND extracted text with confidence score
    const { category, confidence } = await classifyDocument(
      file.originalname,
      extractedText
    );

    const { status: fraudStatus, reason: fraudReason } = await runFraudChecks(
      extractedText,
      category,
      confidence
    );

    console.log(
      `📄 Document classified as: ${category} (confidence: ${(
        confidence * 100
      ).toFixed(2)}%)`
    );

    // Ensure directory exists
    const uploadDir = path.join(
      __dirname,
      "../../uploads",
      category || "unclassified"
    );

    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Rename file to a unique format (timestamp + original filename)
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-"); // ✅ Removes extra extensions
    const finalFilename = `${Date.now()}-${baseName}${ext}`;

    const finalFilePath = path.join(uploadDir, finalFilename);

    await fs.rename(file.path, finalFilePath);

    console.log(`📂 File saved at: ${finalFilePath}`);

    // Save document metadata in MongoDB - assume Document model has been updated to include confidence
    const newDocument = await Document.create({
      name,
      description,
      filename: finalFilename,
      path: finalFilePath,
      hash,
      category,
      classification_confidence: confidence,
      extractedText: extractedText.substring(0, 1000),
      uploadedBy: userId,
      fraudStatus,
      fraudReason,
    });

    console.log("✅ Document saved");

    await new Activity({
      type: "upload",
      user: userId,
      document: newDocument._id,
      status: "pending",
    }).save();

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

// Retaining the existing service functions
export const getUserDocumentService = async (
  userId: string,
  searchQuery?: string,
  category?: string
) => {
  try {
    let query: any = { uploadedBy: userId };

    if (searchQuery) {
      query.name = { $regex: new RegExp(searchQuery, "i") };
    }

    if (category) {
      query.category = category;
    }

    return await Document.find(query)
      .select(
        "_id name filename hash category classification_confidence fraudStatus fraudReason uploadedBy createdAt"
      )
      .sort({ createdAt: -1 });
  } catch (error: any) {
    console.error("❌ Error fetching user documents:", error);
    throw new CustomError(
      "Error fetching user documents: " + error.message,
      500
    );
  }
};

export const downloadFileService = async (
  fileId: string,
  userId: string
): Promise<string> => {
  try {
    // First, check if the user uploaded the document
    let document = await Document.findOne({
      _id: fileId,
      uploadedBy: userId,
    });

    // If not found as owner, check if the document is shared with this user
    if (!document) {
      document = await Document.findOne({
        _id: fileId,
        isShared: true,
        sharedWith: userId,
      });
    }

    // If still not found, user has no access
    if (!document) {
      throw new CustomError(
        "Forbidden: You do not have access to this file",
        403
      );
    }

    // ✅ Construct the file path
    const filePath = document.path;

    if (!filePath) {
      throw new CustomError("File path missing in document record", 500);
    }

    // ✅ Check if the file exists asynchronously
    try {
      await fs.access(filePath);
    } catch (err) {
      throw new CustomError("File not found", 404);
    }

    console.log(`📂 Downloading file: ${filePath}`);
    return filePath; // ✅ Return file path to the controller
  } catch (error) {
    console.error("❌ Error in downloadFileService:", error);
    throw new CustomError("Error retrieving file", 500);
  }
};

export interface AdminStats {
  total: number;
  verified: number;
  pending: number;
  suspicious: number;
  rejected: number;
}
export const getAdminStatsService = async (): Promise<AdminStats> => {
  // Count everything in one go:
  const [total, verified, pending, suspicious, rejected] = await Promise.all([
    Document.countDocuments({}),
    Document.countDocuments({ fraudStatus: "verified" }),
    Document.countDocuments({ fraudStatus: "pending" }),
    Document.countDocuments({ fraudStatus: "suspicious" }),
    Document.countDocuments({ fraudStatus: "rejected" }),
  ]);

  return { total, verified, pending, suspicious, rejected };
};

export const getAllDocumentService = async (
  searchQuery?: string,
  category?: string
) => {
  try {
    let query: any = {};

    if (searchQuery) {
      query.name = { $regex: new RegExp(searchQuery, "i") };
    }

    if (category) {
      query.category = category;
    }

    return await Document.find(query)
      .select(
        "_id name filename hash category classification_confidence fraudStatus fraudReason uploadedBy createdAt"
      )
      .sort({ createdAt: -1 });
  } catch (error: any) {
    console.error("❌ Error fetching user documents:", error);
    throw new CustomError(
      "Error fetching user documents: " + error.message,
      500
    );
  }
};

// Service to unshare a document from a user
export const unshareDocumentService = async (
  documentId: string,
  userId: string,
  adminId: string // Add this parameter
): Promise<void> => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new CustomError("Document not found", 404);
    }

    // Get user details for activity log
    const user = await User.findById(userId).select("name");
    const userName = user ? user.name : userId;

    // Remove the user from sharedWith array
    document.sharedWith = document.sharedWith.filter(
      (id) => id.toString() !== userId
    );

    // If no more users to share with, mark as not shared
    if (document.sharedWith.length === 0) {
      document.isShared = false;
      document.sharedBy = undefined;
      document.sharedAt = undefined;
      document.sharingNote = "";
    }

    await document.save();

    // Add activity record for unsharing
    await new Activity({
      type: "unshare",
      user: adminId,
      document: documentId,
      status: "unshared",
      details: `Access removed for user ${userName}`,
    }).save();
  } catch (error) {
    console.error("❌ Error in unshareDocumentService:", error);
    throw error;
  }
};
// Service to get shared documents for a user
export const getSharedDocumentsService = async (
  userId: string
): Promise<IDocument[]> => {
  try {
    // Find documents shared with the user
    const documents = await Document.find({ isShared: true })
      .populate("uploadedBy", "name email") // Populate the uploader
      .populate("sharedBy", "name email") // Populate who shared it
      .populate("sharedWith", "name email") // Populate users it's shared with
      .sort({ sharedAt: -1 });

    return documents;
  } catch (error) {
    console.error("❌ Error in getSharedDocumentsService:", error);
    throw error;
  }
};

// Service for sharing documents
export const shareDocumentService = async (
  documentId: string,
  userIds: string[],
  adminId: string,
  note?: string
): Promise<IDocument> => {
  try {
    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      throw new CustomError("Document not found", 404);
    }

    // Verify that all user IDs exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      throw new CustomError("One or more user IDs are invalid", 400);
    }

    // Update the document with sharing information
    document.isShared = true;
    document.sharedWith = userIds.map((id) => new mongoose.Types.ObjectId(id));
    document.sharedBy = new mongoose.Types.ObjectId(adminId);
    document.sharedAt = new Date();
    document.sharingNote = note || "";

    // Save the updated document
    await document.save();

    // Add activity record for sharing
    await new Activity({
      type: "share",
      user: adminId,
      document: documentId,
      status: "shared",
      details: `Shared with ${userIds.length} user(s)${
        note ? `: ${note}` : ""
      }`,
    }).save();

    return document;
  } catch (error) {
    console.error("❌ Error in shareDocumentService:", error);
    throw error;
  }
};
