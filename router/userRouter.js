import express from "express";
import { profile, registerUser, loginUser, updateUserProfile, updateUserPassword, deleteUserAccount, addAddress, removeAddress, getDefaultAddress } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile
router.get("/profile", authMiddleware(), profile);
router.put("/profile/update", authMiddleware(), updateUserProfile);
router.put("/profile/update-password", authMiddleware(), updateUserPassword);
router.delete("/profile/delete", authMiddleware(), deleteUserAccount);

// Addresses
router.post("/profile/addresses", authMiddleware(), addAddress);
router.get("/profile/addresses/default", authMiddleware(), getDefaultAddress);
router.delete("/profile/addresses/:addressId", authMiddleware(), removeAddress);


export default router;
