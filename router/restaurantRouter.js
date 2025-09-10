import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { addOwnerResponse, addRating, deleteMyRestaurant, deleteRating, getMyRestaurant, getRatings, getRatingsForOwner, updateRating, updateRestaurant, updateRestaurantDetails } from "../controller/restaurantController.js";
import { getMyMenuItemById, getMyMenuItems } from "../controller/menuItemController.js";
import { getAllOrders, getOrderDetails, changeOrderStatus } from "../controller/orderController.js";


const router = express.Router();

router.get("/my-restaurant", authMiddleware(["restaurant"]), getMyRestaurant);
router.put("/my-restaurant", authMiddleware(["restaurant"]), updateRestaurant);
router.put("/my-restaurant/details", authMiddleware(["restaurant"]), updateRestaurantDetails);
router.delete("/my-restaurant", authMiddleware(["restaurant"]), deleteMyRestaurant);

router.get("/my-restarant/menu-items", authMiddleware(["restaurant"]), getMyMenuItems);
router.get("/my-restarant/menu-items/:id", authMiddleware(["restaurant"]), getMyMenuItemById);

router.get("/my-restaurant/orders", authMiddleware(["restaurant"]), getAllOrders
);
router.get("/my-restaurant/orders/details/:id", authMiddleware(["restaurant"]), getOrderDetails);

router.put("/my-restaurant/orders/update-status", authMiddleware(["restaurant"]), changeOrderStatus);
// Alle Bewertungen für das eigene Restaurant abrufen
router.get(
  "/my-restaurant/ratings", authMiddleware(["restaurant"]),  getRatingsForOwner
);

// Feedback/Antwort auf eine Bewertung hinzufügen
router.post(
  "/my-restaurant/ratings/:ratingId/response",
  authMiddleware(["restaurant"]),
  addOwnerResponse
);


// POST /restaurants/:id/rating → Bewertung abgeben
router.post("/:id/rating", authMiddleware(["user"]), addRating);

// GET /restaurants/:id/ratings → Alle Bewertungen abrufen
router.get("/:id/ratings", getRatings);

// PUT /restaurants/:id/rating → Eigene Bewertung aktualisieren
router.put("/:id/rating", authMiddleware(["user"]), updateRating);

// DELETE /restaurants/:id/rating → Eigene Bewertung löschen
router.delete("/:id/rating", authMiddleware(["user"]), deleteRating);

export default router;