import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { deleteRestaurantOwner, getAllRestaurantOwners, getRestaurantOwnerById } from "../controller/adminController.js"


const router = express.Router()

router.get("/restaurant-owners", authMiddleware(["admin"]), getAllRestaurantOwners)
router.get("/restaurant-owners/:id", authMiddleware(["admin"]), getRestaurantOwnerById)
router.delete("/restaurant-owners/:id", authMiddleware(["admin"]),deleteRestaurantOwner);

export default router