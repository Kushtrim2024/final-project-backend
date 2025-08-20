import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { deleteRestaurantOwner, getAllRestaurantOwners, getRestaurantOwnerById } from "../controller/adminController.js"


const router = express.Router()

router.get("/", authMiddleware(["admin"]), getAllRestaurantOwners);
router.get("/:id", authMiddleware(["admin"]), getRestaurantOwnerById);
router.delete("/:id", authMiddleware(["admin"]), deleteRestaurantOwner);


export default router