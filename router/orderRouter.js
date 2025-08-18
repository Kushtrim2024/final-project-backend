import express from "express";
// import { createOrder, getOrders, updateOrder } from "../controller/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// router.get("/", authMiddleware(["admin", "restaurant", "user"]), getOrders);
// router.post("/", authMiddleware(["user"]), createOrder);
// router.put("/:id", authMiddleware(["admin", "restaurant"]), updateOrder);

export default router;
