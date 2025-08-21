import express from "express";
// import { addMenuItem } from "../controller/restaurantController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { deleteRestaurantOwnerAccount, getRestaurantOwnerProfile, loginRestaurantOwner, updateRestaurantOwnerProfile, registerRestaurantOwner, updateRestaurantOwnerPassword } from "../controller/registerRestaurantOwner.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

// Auth (öffentlich)
router.post("/register", registerRestaurantOwner);
router.post("/login", loginRestaurantOwner);

// Profile (nur RestaurantOwner)
router.get("/profile", authMiddleware(["restaurant"]), getRestaurantOwnerProfile);
router.put("/profile/update", authMiddleware(["restaurant"]), updateRestaurantOwnerProfile);
router.put("/profile/update-password", authMiddleware(["restaurant"]),updateRestaurantOwnerPassword);
router.delete("/profile/delete", authMiddleware(["restaurant"]), deleteRestaurantOwnerAccount);

// router.post("/menu", authMiddleware(["restaurant"]), addMenuItem);

export default router;
