import express from "express";
import { getRestaurantOwnerProfile } from "../controller/registerRestaurantOwner.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getRestaurantOwner", authMiddleware(["restaurant"]), getRestaurantOwnerProfile);

export default router;