import { Router } from "express";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/register", authController.register);                             // Register route
router.post("/login", authController.login);                                   // Login route
router.get("/logout", authController.logout);                                  // Logout route
router.post("/refresh-token", authController.refreshToken);                    // Refresh token route

export default router;
