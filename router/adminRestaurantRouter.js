import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantDetails,
  getRatings,
  getAllRatings,
  adminDeleteRating
} from "../controller/restaurantController.js";
import { updateRestaurantStatus } from "../controller/adminController.js";

const router = express.Router();

router.get("/", authMiddleware(["admin"]), getAllRestaurants);
router.get("/:id", authMiddleware(["admin"]), getRestaurantById);
router.post("/", authMiddleware(["admin"]), createRestaurant);
router.put("/:id", authMiddleware(["admin"]), updateRestaurant);
router.put("/:id/details", authMiddleware(["admin"]), updateRestaurantDetails);
router.delete("/:id", authMiddleware(["admin"]), deleteRestaurant);


// Für ein bestimmtes Restaurant
router.get("/:id/ratings", authMiddleware(["admin"]), getRatings);

// Für alle Restaurants
router.get("/ratings", authMiddleware(["admin"]), getAllRatings);

// Bewertung löschen
router.delete("/:id/ratings/:ratingId", authMiddleware(["admin"]), adminDeleteRating);



export default router;
