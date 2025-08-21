import express from "express";
import {
  addToCart,
  viewCart,
  choosePaymentMethod,
  checkout
} from "../controller/cartController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Warenkorb
router.post("/add",authMiddleware(["user"]),addToCart);            
router.get("/:userId",authMiddleware(["user"]),viewCart);             
router.post("/choose-payment",authMiddleware(["user"]),choosePaymentMethod);
router.post("/checkout",authMiddleware(["user"]),checkout);          

export default router;
