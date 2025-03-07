import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db";
import documentRoutes from "./routes/documentRoutes";
import authRoutes from "./routes/authRoutes";
import { authenticateJWT } from "./middlewares/authMiddleware";
import { errorHandler } from "./middlewares/errorHandler";
import { PUBLIC_ROUTES } from "./constants/publicRoutes";

dotenv.config();
const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://172.29.16.1:5173"], // 🔹 Allow Vite frontend (Replace X.X with your IP)
  credentials: true, // 🔹 Allow cookies, authentication headers
  methods: ["GET", "POST", "PUT", "DELETE"], // 🔹 Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // 🔹 Allow JWT authentication headers
};

app.use(cors(corsOptions));

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// ✅ Apply Global JWT Middleware (Except for Public Routes)
app.use((req, res, next) => {
  if (PUBLIC_ROUTES.some((route) => req.path.startsWith(route))) {
    return next(); // ✅ Explicit return
  }
  authenticateJWT(req, res, next); // ✅ Calls middleware properly
});

// ✅ API Routes
app.use("/api/auth", authRoutes); // Public Routes: Register, Login, Forgot Password
app.use("/api/documents", documentRoutes); // Protected Routes: Requires JWT

// ✅ Global Error Handler
app.use(errorHandler);

export default app;
