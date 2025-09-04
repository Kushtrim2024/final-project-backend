import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { deleteMyRestaurant, getMyRestaurant, updateRestaurant, updateRestaurantDetails } from "../controller/restaurantController.js";
import { getMyMenuItemById, getMyMenuItems } from "../controller/menuItemController.js";


const router = express.Router();

router.get("/my-restaurant", authMiddleware(["restaurant"]), getMyRestaurant);
router.put("/my-restaurant", authMiddleware(["restaurant"]), updateRestaurant);
router.put("/my-restaurant/details", authMiddleware(["restaurant"]), updateRestaurantDetails);
router.delete("/my-restaurant", authMiddleware(["restaurant"]), deleteMyRestaurant);

router.get("/my-restarant/menu-items", authMiddleware(["restaurant"]), getMyMenuItems);
router.get("/my-restarant/menu-items/:id", authMiddleware(["restaurant"]), getMyMenuItemById);

export default router;