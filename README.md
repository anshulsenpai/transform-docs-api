📜 Project: Document Storage & Verification with OCR & AI
🚀 A secure and intelligent document storage, classification, and verification system using OCR, AI-based classification, and blockchain-inspired hash verification.



📌 Problem Statement
In organizations, students, and legal document handling, verifying and categorizing important documents (e.g., question papers, notices, certificates) is a major challenge:
- No standard structure for storing and organizing files.
- Duplicate file uploads without any check.
- Manual classification of documents is time-consuming.
- Difficult verification of document authenticity.
- No automated text extraction from PDFs/images.



💡 Our Solution
We provide an AI-driven secure document management system that:
✅ Uses OCR (Tesseract.js) to extract text from scanned documents.  
✅ Uses AI-based classification to organize files into categories.  
✅ Hashes every file (SHA-256) to prevent duplicate uploads.  
✅ Allows users to verify authenticity using a document hash.  
✅ Provides a structured storage system for efficient retrieval.



🛠 Tech Stack
| Technology  | Usage  |
|||
| Node.js + Express | Backend API Server |
| MongoDB + Mongoose | NoSQL Database for storing documents |
| TypeScript | Ensures type safety and scalability |
| Multer | File upload middleware for handling PDFs and images |
| pdf-poppler | Converts PDFs into images for OCR processing |
| Tesseract.js | Performs OCR to extract text from images/PDFs |
| JWT (JSON Web Token) | Secure authentication for users |
| Bcrypt.js | Hashing passwords for authentication security |



🚀 Features
✅ Secure User Authentication (Register/Login using JWT)  
✅ Upload Documents (PDF, Images)  
✅ Classify Documents Automatically (e.g., Question Papers, Notices)  
✅ Extract Text from Scanned Images/PDFs  
✅ Prevent Duplicate Uploads using SHA-256 Hashing  
✅ Verify Authenticity of Documents  
✅ Store Documents in a Structured Format  



📂 Folder Structure

backend/
│── src/
│   ├── controllers/          # API Controllers (Handles HTTP requests)
│   │   ├── authController.ts  # Authentication logic
│   │   ├── documentController.ts  # Document handling logic
│   │
│   ├── services/             # Business Logic (Interacts with DB & processing)
│   │   ├── authService.ts     # Handles authentication logic
│   │   ├── documentService.ts # Handles document processing (OCR, storage)
│   │
│   ├── middlewares/          # Middleware (JWT, Multer, Error Handling)
│   │   ├── authMiddleware.ts  # JWT Authentication Middleware
│   │   ├── fileUploadMiddleware.ts  # Multer for handling file uploads
│   │   ├── errorHandler.ts    # Centralized error handling
│   │
│   ├── models/               # MongoDB Models
│   │   ├── User.ts            # User schema
│   │   ├── Document.ts        # Document schema
│   │
│   ├── routes/               # Express API Routes
│   │   ├── authRoutes.ts      # Authentication routes
│   │   ├── documentRoutes.ts  # Document-related routes
│   │
│   ├── utils/                # Utility functions
│   │   ├── customError.ts     # Custom error handler
│   │   ├── responseMessages.ts  # Response messages constants
│   │
│   ├── config/               # Configuration files
│   │   ├── db.ts              # MongoDB connection setup
│   │
│   ├── types/                # TypeScript Type Definitions
│   │   ├── express.ts         # Custom request types (e.g., req.user)
│   │
│   ├── app.ts                # Main Express App (Initializes Express)
│   ├── server.ts             # Starts the Backend Server
│
├── .gitignore                # Ignoring sensitive files
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript Config
├── .env                      # Environment Variables




📖 Setup Guide
1️⃣ Clone the Repository

git clone https://github.com/your-repo/document-verification-system.git
cd document-verification-system


2️⃣ Install Dependencies

npm install


3️⃣ Create a `.env` File

PORT=5050
MONGO_URI=mongodb://localhost:27017/document_db
JWT_SECRET=your_jwt_secret
UPLOAD_DIR=uploads


4️⃣ Start the Server

npm start

Your API will be running at `http://localhost:5050` 🚀


🛠 API Endpoints
🔐 Authentication
| Endpoint | Method | Description |
|-|--|-|
| `/api/auth/register` | `POST` | Register a new user |
| `/api/auth/login` | `POST` | Login and get JWT token |

📂 Document Handling
| Endpoint | Method | Description |
|-|--|-|
| `/api/documents/upload` | `POST` | Upload document (PDF, Image) |
| `/api/documents/verify` | `POST` | Verify document authenticity |


🔍 How It Works
1️⃣ User logs in and receives a JWT token.  
2️⃣ Uploads a document (PDF/Image) using `/api/documents/upload`.  
3️⃣ The system:
   - ✅ Extracts text (OCR)
   - ✅ Classifies document into a structured format
   - ✅ Stores metadata and file securely
4️⃣ User can verify the authenticity of a document using `/api/documents/verify`.  


📌 Future Enhancements
🔹 AI-Based Document Classification with ML Models.  
🔹 Blockchain-based Document Verification.  
🔹 Real-time Document Search & Retrieval.  


💡 Contributors
🚀 Developed by Anshul & Team 💻  
Contributions & feedback are welcome!  


📜 License
📝 MIT License - Free to use and modify.


🚀 Ready to Use?
Start the server and test APIs using Postman or a Frontend Client!  
If you face issues, feel free to raise an issue! 🔥🚀
