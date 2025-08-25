import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminDashboard, changeAdminPassword, deleteAdmin, getAdminById, getAllAdmins, loginAdmin, registerAdmin, updateAdminProfile} from "../controller/adminController.js";
import Admin from "../models/Admin.js";
import { changeOrderStatus, deleteOrder, getAllOrders, getOrderDetails} from "../controller/orderController.js";


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
router.post("/login", loginAdmin)

// Admins können andere Admins verwalten
router.get("/", authMiddleware(["admin"]), getAllAdmins);
router.get("/id/:id", authMiddleware(["admin"]), getAdminById);
router.put("/profile/update", authMiddleware(["admin"]), updateAdminProfile);
router.put("/profile/change-password", authMiddleware(["admin"]), changeAdminPassword);
router.delete("/profile/:id/delete", authMiddleware(["admin"]), deleteAdmin);

router.get("/orders", authMiddleware(["admin", "restaurant", "user"]), getAllOrders);
router.put("/orders/status", authMiddleware(["admin", "restaurant"]), changeOrderStatus);
router.get("/orders/details/:id", authMiddleware(["user", "restaurant", "admin"]), getOrderDetails);

router.delete("/:orderId", authMiddleware(["admin", "restaurant"]), deleteOrder);


export default router;
