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
app.use(cors());
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
