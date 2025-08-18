import express from "express";
import { profile, registerUser, loginUser, updateUserProfile, updateUserPassword, deleteUserAccount } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Jeder eingeloggte User (egal welche Rolle)
router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", authMiddleware(), profile);
router.put("/profile/update", authMiddleware(), updateUserProfile);
router.put("/profile/update-password", authMiddleware(), updateUserPassword);
router.delete("/profile/delete", authMiddleware(), deleteUserAccount);


export default router;
