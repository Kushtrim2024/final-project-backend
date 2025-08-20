import express from "express";
import { 
  getAllRestaurants, 
  getRestaurantById, 
  getRestaurantsByCategory, 
  getRestaurantsByLocation, 
  getRestaurantsByPostCode, 
  searchRestaurants 
} from "../controller/restaurantController.js";

const router = express.Router();

// Spezifische Routen zuerst
router.get("/search", searchRestaurants);
router.get("/postcode", getRestaurantsByPostCode);
router.get("/category", getRestaurantsByCategory);
router.get("/location", getRestaurantsByLocation)

// Dynamische ID zuletzt
router.get("/:id", getRestaurantById);

// Alle Restaurants
router.get("/", getAllRestaurants);

export default router;
