import express from "express";
import { getAllUsersController } from "../controllers/userController";
import { isAdmin } from "../middlewares/roleMiddleware";

const router = express.Router();

// Get all users (admin only)
router.get("/get-users", isAdmin, getAllUsersController);

// Export the router
export default router;
