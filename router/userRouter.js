import express from "express";
import { profile, registerUser, loginUser, updateUserProfile, updateUserPassword, deleteUserAccount, addAddress, removeAddress, getDefaultAddress, uploadProfilePicture } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";



const router = express.Router();

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile
router.get("/profile", authMiddleware(["user"]), profile);
router.put("/profile/update", authMiddleware(["user"]), updateUserProfile);
router.put("/profile/update-password", authMiddleware(["user"]), updateUserPassword);
router.delete("/profile/delete", authMiddleware(["user"]), deleteUserAccount);

// Profile image upload
router.put(
  "/profile/photo",          
  authMiddleware(["user"]),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  uploadProfilePicture
);

// Addresses
router.post("/profile/addresses", authMiddleware(["user"]), addAddress);
router.get("/profile/addresses/default", authMiddleware(["user"]), getDefaultAddress);
router.delete("/profile/addresses/:addressId", authMiddleware(["user"]), removeAddress);


export default router;
