import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  deleteRestaurantOwnerAccount,
  getRestaurantOwnerProfile,
  loginRestaurantOwner,
  updateRestaurantOwnerProfile,
  registerRestaurantOwner,
  updateRestaurantOwnerPassword,
  updateRestaurantProfile,
  uploadRestaurantCover,
} from "../controller/registerRestaurantOwner.js";
import {
  deleteOrder,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
} from "../controller/orderController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Auth (öffentlich)
router.post("/register", registerRestaurantOwner);
router.post("/login", loginRestaurantOwner);

// Profile (nur RestaurantOwner)
router.get(
  "/profile",
  authMiddleware(["restaurant"]),
  getRestaurantOwnerProfile
);
router.put(
  "/profile/update",
  authMiddleware(["restaurant"]),
  updateRestaurantOwnerProfile
);
router.put(
  "/profile/update-password",
  authMiddleware(["restaurant"]),
  updateRestaurantOwnerPassword
);
router.delete(
  "/profile/delete",
  authMiddleware(["restaurant"]),
  deleteRestaurantOwnerAccount
);

router.get("/orders", authMiddleware(["restaurant", "admin"]), getAllOrders);
router.put(
  "/orders/status",
  authMiddleware(["admin", "restaurant"]),
  updateOrderStatus
);
router.get(
  "/orders/details/:id",
  authMiddleware(["user", "restaurant", "admin"]),
  getOrderDetails
);

// Restaurant JSON update
router.put(
  "/restaurant",
  authMiddleware(["restaurant"]),
  updateRestaurantProfile
);
// Cover upload (multipart)
router.put(
  "/restaurant/cover",
  authMiddleware(["restaurant"]),
  upload.single("coverPhoto"),
  uploadRestaurantCover
);

router.delete(
  "/orders/:orderId",
  authMiddleware(["admin", "restaurant"]),
  deleteOrder
);

// Cover upload (FormData field adı: coverPhoto)
router.put(
  "/restaurant/cover",
  authMiddleware(["restaurant"]),
  upload.single("coverPhoto"),
  uploadRestaurantCover
);

export default router;