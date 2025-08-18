import express from "express";
import { getMenuItems, createMenuItem } from "../controller/menuItemController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:restaurantId", getMenuItems); // alle MenuItems eines Restaurants
router.post("/:restaurantId", authMiddleware(["restaurant"]), createMenuItem);

export default router;
