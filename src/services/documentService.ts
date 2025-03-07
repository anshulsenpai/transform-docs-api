import natural from "natural";
import { TfIdf } from "natural";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import poppler from "pdf-poppler";
import Tesseract from "tesseract.js";
import Document from "../models/Document";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { CustomError } from "../utils/customError";

// Category definitions with weighted keywords
const CATEGORIES = {
  "question-paper": {
    keywords: [
      "question",
      "exam",
      "paper",
      "test",
      "marks",
      "answer",
      "write",
      "solve",
      "time",
      "allowed",
    ],
    keyPhrases: [
      "total marks",
      "time allowed",
      "answer all questions",
      "section a",
      "multiple choice",
    ],
  },
  notice: {
    keywords: [
      "notice",
      "announcement",
      "attention",
      "inform",
      "regarding",
      "hereby",
      "issued",
    ],
    keyPhrases: [
      "public notice",
      "all concerned",
      "take notice that",
      "please note",
      "important notice",
    ],
  },
  notification: {
    keywords: [
      "notification",
      "circular",
      "official",
      "inform",
      "government",
      "authority",
      "directive",
    ],
    keyPhrases: [
      "government notification",
      "official notification",
      "it is notified",
      "circular no",
    ],
  },
  "score-card": {
    keywords: [
      "scorecard",
      "marksheet",
      "result",
      "grade",
      "score",
      "marks",
      "percentage",
      "cgpa",
      "semester",
    ],
    keyPhrases: [
      "marks obtained",
      "total score",
      "grade sheet",
      "examination result",
      "pass percentage",
    ],
  },
  certificate: {
    keywords: [
      "certificate",
      "certify",
      "achievement",
      "diploma",
      "degree",
      "awarded",
      "completion",
    ],
    keyPhrases: [
      "this is to certify",
      "has been awarded",
      "successfully completed",
      "date of issue",
    ],
  },
  invoice: {
    keywords: [
      "invoice",
      "bill",
      "payment",
      "amount",
      "total",
      "price",
      "tax",
      "due",
      "paid",
      "item",
    ],
    keyPhrases: [
      "invoice no",
      "billing address",
      "payment due",
      "total amount",
      "tax invoice",
    ],
  },
  "id-card": {
    keywords: [
      "id",
      "identity",
      "card",
      "passport",
      "aadhar",
      "pan",
      "identification",
      "number",
      "photo",
    ],
    keyPhrases: [
      "identity card",
      "date of birth",
      "identification number",
      "valid until",
      "authorized signature",
    ],
  },
  "medical-record": {
    keywords: [
      "medical",
      "surgical",
      "pathalogy",
      "lab",
      "laboratory",
      "prescription",
      "doctor",
      "patient",
      "medicine",
      "treatment",
      "diagnosis",
      "hospital",
    ],
    keyPhrases: [
      "patient name",
      "doctor's prescription",
      "medical history",
      "dosage",
      "follow up",
    ],
  },
  "bank-statement": {
    keywords: [
      "bank",
      "statement",
      "account",
      "balance",
      "transaction",
      "debit",
      "credit",
      "deposit",
      "withdrawal",
    ],
    keyPhrases: [
      "account statement",
      "opening balance",
      "closing balance",
      "transaction date",
      "statement period",
    ],
  },
  report: {
    keywords: [
      "report",
      "analysis",
      "findings",
      "summary",
      "conclusion",
      "recommendation",
      "research",
    ],
    keyPhrases: [
      "executive summary",
      "findings and analysis",
      "conclusion and recommendations",
      "reported by",
    ],
  },
  "admit-card": {
    keywords: [
      "admit",
      "card",
      "hall",
      "ticket",
      "examination",
      "venue",
      "candidate",
      "roll",
      "center",
    ],
    keyPhrases: [
      "hall ticket",
      "examination center",
      "admit card",
      "roll number",
      "reporting time",
    ],
  },
  "contract-agreement": {
    keywords: [
      "contract",
      "agreement",
      "parties",
      "terms",
      "conditions",
      "clause",
      "signed",
      "legal",
      "binding",
    ],
    keyPhrases: [
      "terms and conditions",
      "agreement between",
      "party of the first part",
      "hereinafter referred",
    ],
  },
  "salary-slip": {
    keywords: [
      "salary",
      "payslip",
      "pay",
      "earnings",
      "deductions",
      "net",
      "gross",
      "employee",
      "month",
    ],
    keyPhrases: [
      "salary slip",
      "pay period",
      "net pay",
      "gross earnings",
      "employee id",
    ],
  },
};

// Initialize tokenizer
const tokenizer = new natural.WordTokenizer();

/**
 * Determines document category using advanced NLP techniques
 * while keeping the existing structure
 */
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

  // Calculate scores for each category
  const scores = Object.entries(CATEGORIES).map(([category, features]) => {
    let score = 0;

    // Check for keywords in tokenized text
    features.keywords.forEach((keyword) => {
      // Use TF-IDF to get importance score of this keyword
      const keywordScore = tfidf.tfidf(keyword, 0);
      score += keywordScore;

      // Add bonus points if keyword appears in tokens
      if (filteredTokens.includes(keyword)) {
        score += 3;
      }
    });

    // Check for key phrases (strong indicators)
    features.keyPhrases.forEach((phrase) => {
      if (lowerCaseText.includes(phrase.toLowerCase())) {
        score += 10;

        // Tokenize the phrase and check for token matches
        const phraseTokens = tokenizer.tokenize(phrase.toLowerCase());
        const matchingTokens = phraseTokens.filter(
          (token: any) => filteredTokens.includes(token) && token.length > 3
        );

        // If multiple tokens from the phrase match, it's a stronger signal
        if (matchingTokens.length > 1) {
          score += matchingTokens.length * 2;
        }
      }
    });

    return { category, score };
  });

  // Sort by score and get the highest
  scores.sort((a, b) => b.score - a.score);

  // If top score is too low, mark as unclassified
  if (scores.length === 0 || scores[0].score < 5) {
    console.log("⚠️ Low confidence classification, marking as unclassified");
    return { category: "unclassified", confidence: 0 };
  }

  // Calculate confidence (normalize the score)
  const topScore = scores[0].score;
  const confidence = Math.min(topScore / 50, 1);

  return {
    category: scores[0].category,
    confidence,
  };
};

// Helper functions to maintain compatibility with existing code
function getFilenameCategory(filename: any) {
  if (/question|paper|exam/i.test(filename)) return "question-paper";
  if (/notice|announcement/i.test(filename)) return "notice";
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
      name, // ✅ Store user-defined name
      description, // ✅ Store optional description
      filename: finalFilename,
      path: finalFilePath, // ✅ Store file path
      hash,
      category,
      classification_confidence: confidence, // Add confidence score
      extractedText: extractedText.substring(0, 1000), // Store a sample for potential retraining
      uploadedBy: userId,
    });

    console.log("✅ Document saved");

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
        "_id name filename hash category classification_confidence uploadedBy createdAt"
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

export const verifyDocumentService = async (fileHash: string) => {
  try {
    console.log("🔍 Verifying document...");

    const document = await Document.findOne({ hash: fileHash }).select(
      "_id filename hash name description category status uploadedBy createdAt"
    );

    if (!document) {
      console.log("❌ Document not found.");
      throw new CustomError(RESPONSE_MESSAGES.DOCUMENT_NOT_FOUND, 404);
    }
    console.log("✅ Document Verified");
    return { message: RESPONSE_MESSAGES.DOCUMENT_AUTHENTIC, document };
  } catch (error: any) {
    console.error("❌ Error in verifyDocumentService:", error);
    throw new CustomError(
      RESPONSE_MESSAGES.ERROR_VERIFICATION + ": " + error.message,
      500
    );
  }
};

export const downloadFileService = async (
  fileId: string,
  userId: string
): Promise<string> => {
  try {
    // ✅ Find the document in the database
    const document = await Document.findOne({
      _id: fileId,
      uploadedBy: userId,
    });

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
