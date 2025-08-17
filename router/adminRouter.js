import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminDashboard, changeAdminPassword, deleteAdmin, getAdminById, getAllAdmins, registerAdmin, updateAdminProfile } from "../controller/adminController.js";
import Admin from "../models/Admin.js";

const router = express.Router();

// Nur Admins
router.get("/dashboard", authMiddleware(["admin"]), adminDashboard);
router.post("/register", async (req, res, next) => {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    // First admin: no auth required
    return registerAdmin(req, res);
  } else {
    // Subsequent admins: require auth
    return authMiddleware(["admin"])(req, res, () => registerAdmin(req, res));
  }
});
router.put("/profile/update", authMiddleware(["admin"]), updateAdminProfile);
router.delete("/:id/delete", authMiddleware(["admin"]), deleteAdmin);
router.get("/", authMiddleware(["admin"]), getAllAdmins);
router.get("/:id", authMiddleware(["admin"]), getAdminById);
router.put("/change-password", authMiddleware(["admin"]), changeAdminPassword);

// Export the router



export default router;
