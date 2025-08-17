import express from "express";
// import { addMenuItem } from "../controller/restaurantController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { deleteRestaurantOwnerAccount, getRestaurantOwnerProfile, loginRestaurantOwner, updateRestaurantOwnerProfile, registerRestaurantOwner } from "../controller/registerRestaurantOwner.js";

const router = express.Router();

// Nur Restaurantbesitzer
router.post("/register", registerRestaurantOwner);
router.post("/login", loginRestaurantOwner);
router.get("/getRestaurantOwner", authMiddleware(["restaurant"]), getRestaurantOwnerProfile);
router.put("/profile/update", updateRestaurantOwnerProfile);
router.delete("/profile/delete", deleteRestaurantOwnerAccount);
// router.post("/menu", authMiddleware(["restaurant"]), addMenuItem);

export default router;
