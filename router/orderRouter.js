import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { 
  addToCart,
  checkout,
  choosePaymentMethod,
  getOrderDetails,
  getOrderHistory,
  placeOrder,
  updateOrder,
  viewCart,
  cancelOrder
} from "../controller/orderController.js";

const router = express.Router();

// Cart
router.post("/cart", authMiddleware(["user"]), addToCart);
router.get("/users/:userId/cart", authMiddleware(["user"]), viewCart);

// Orders
router.post("/:orderId/payment", authMiddleware(["user"]), choosePaymentMethod);
router.post("/:orderId/placeorder", authMiddleware(["user"]), placeOrder);
router.post("/:orderId/checkout", authMiddleware(["user"]), checkout);

// Cancel & Update
router.put("/:orderId/cancel", authMiddleware(["user"]), cancelOrder);
router.put("/:orderId", authMiddleware(["user"]), updateOrder);

// History & Details
router.get("/:orderId/details", authMiddleware(["user"]), getOrderDetails);
router.get("/history/:userId", authMiddleware(["user"]), getOrderHistory);


export default router;
