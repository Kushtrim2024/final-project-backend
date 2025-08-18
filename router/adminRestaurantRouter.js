import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantDetails
} from "../controller/restaurantController.js";

const router = express.Router();

 router.get("/", authMiddleware(["admin"]), getAllRestaurants);
 router.get("/:id", authMiddleware(["admin"]), getRestaurantById);
 router.post("/", authMiddleware(["admin"]),createRestaurant);
 router.put("/:id", authMiddleware(["admin"]), updateRestaurant);
 router.put("/:id/details", authMiddleware(["admin"]), updateRestaurantDetails);
 router.delete("/:id", authMiddleware(["admin"]), deleteRestaurant);

export default router;
