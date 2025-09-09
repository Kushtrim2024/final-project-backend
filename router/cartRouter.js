import express from "express";
import {
  addToCart,
  viewCart,
  choosePaymentMethod,
  checkout,
} from "../controller/cartController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
} from "../controller/userController.js";

const router = express.Router();
// 🔹 Alle Routen benötigen Authentifizierung
router.use(authMiddleware(["user"]));

// Warenkorb
router.post("/add", authMiddleware(["user"]), addToCart);
router.get("/:userId", authMiddleware(["user"]), viewCart);
router.post("/choose-payment", authMiddleware(["user"]), choosePaymentMethod);
router.post("/checkout", authMiddleware(["user"]), checkout);

// 💳 Zahlungsmethoden
router.post("/add-payment", addPaymentMethod);
router.get("/payment-methods", getPaymentMethods);
router.post("/delete-payment", deletePaymentMethod);

export default router;
