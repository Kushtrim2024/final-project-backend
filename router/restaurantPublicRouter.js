import express from "express";
import { 
  getAllRestaurants, 
  getRestaurantById, 
  getRestaurantsByCategory, 
  getRestaurantsByLocation, 
  getRestaurantsByPostCode, 
  searchRestaurants,
} from "../controller/restaurantController.js";
import { getMenuItemById, getMenuItems } from "../controller/menuItemController.js";

const router = express.Router();

// Filter-Routen zuerst
router.get("/search", searchRestaurants);
router.get("/postcode", getRestaurantsByPostCode);
router.get("/category", getRestaurantsByCategory);
router.get("/location", getRestaurantsByLocation);

// Produkte eines Restaurants (öffentlich)
router.get("/:restaurantId/products", getMenuItems);
router.get("/:restaurantId/products/:id", getMenuItemById); // Für Kompatibilität mit alten Routen

// Dynamische ID zuletzt
router.get("/:id", getRestaurantById);

// Alle Restaurants
router.get("/", getAllRestaurants);

export default router;
