import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controller/menuItemController.js";

const router = express.Router({ mergeParams: true }); 
// mergeParams erlaubt Zugriff auf :restaurantId vom Parent Router

// Alle MenuItems eines Restaurants
// GET /owner/restaurants/:restaurantId/menu-items
router.get("/", getMenuItems);

// Neues MenuItem mit Bildupload
// POST /owner/restaurants/:restaurantId/menu-items
router.post(
  "/",
  authMiddleware(["restaurant"]),
  upload.array("images", 5), // bis zu 5 Bilder
  createMenuItem
);

// Ein MenuItem aktualisieren
// PUT /owner/restaurants/:restaurantId/menu-items/:id
router.put("/:id", authMiddleware(["restaurant"]), updateMenuItem);

// Ein MenuItem löschen
// DELETE /owner/restaurants/:restaurantId/menu-items/:id
router.delete("/:id", authMiddleware(["restaurant"]), deleteMenuItem);

export default router;
