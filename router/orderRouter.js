import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { 

  getOrderDetails,
  getOrderHistory,
  placeOrder,
  updateOrder,
  cancelOrder
} from "../controller/orderController.js";

const router = express.Router();


// Orders
router.post("/:orderId/placeorder", authMiddleware(["user"]), placeOrder);

// Cancel & Update
router.put("/:orderId/cancel", authMiddleware(["user"]), cancelOrder);
router.put("/:orderId", authMiddleware(["user"]), updateOrder);

// History & Details
router.get("/:orderId/details", authMiddleware(["user"]), getOrderDetails);
router.get("/history/:userId", authMiddleware(["user"]), getOrderHistory);


export default router;
