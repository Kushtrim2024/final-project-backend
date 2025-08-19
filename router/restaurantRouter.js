import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { deleteMyRestaurant, getMyRestaurant, updateRestaurant, updateRestaurantDetails } from "../controller/restaurantController.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/my-restaurant", authMiddleware(["restaurant"]), adminMiddleware, getMyRestaurant);
router.put("/my-restaurant", authMiddleware(["restaurant"]), updateRestaurant);
router.put("/my-restaurant/details", authMiddleware(["restaurant"]), updateRestaurantDetails);
router.delete("/my-restaurant", authMiddleware(["restaurant"]), deleteMyRestaurant);

export default router;