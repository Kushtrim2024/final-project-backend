import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { 

  getOrderDetails,
  getOrderHistory,
  placeOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} from "../controller/orderController.js";

const router = express.Router();


// Orders
router.post("/", authMiddleware(["user"]), placeOrder);
router.get("/", authMiddleware(["user","admin"]), getAllOrders);

router.get("/history", authMiddleware(["user"]), getOrderHistory);

// Details zuerst, bevor allgemeine :orderId
// Alle Rollen, die Zugriff haben sollen
router.get("/details/:id", authMiddleware(["user","admin"]), getOrderDetails);


// Cancel & Update
router.put("/cancel/:orderId", authMiddleware(["user"]), cancelOrder);
router.put("/:orderId", authMiddleware(["user"]), updateOrderStatus);


export default router;
