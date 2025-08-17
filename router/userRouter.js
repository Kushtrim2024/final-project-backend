import express from "express";
import { profile, registerUser, loginUser, updateUserProfile, deleteUserAccount} from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Jeder eingeloggte User (egal welche Rolle)
router.get("/profile", authMiddleware(), profile);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/profile/update", authMiddleware(), updateUserProfile);
router.delete("/profile/delete", authMiddleware(), deleteUserAccount);

export default router;
