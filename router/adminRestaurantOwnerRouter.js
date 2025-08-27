import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { deleteRestaurantOwner, getAllRestaurantOwners, getRestaurantOwnerById, updateRestaurantOwner, updateRestaurantStatus } from "../controller/adminController.js"


const router = express.Router()

router.get("/", authMiddleware(["admin"]), getAllRestaurantOwners);
router.get("/:id", authMiddleware(["admin"]), getRestaurantOwnerById);
router.put("/:id/status", authMiddleware(["admin"]), updateRestaurantStatus);
router.put("/:id", authMiddleware(["admin"]), updateRestaurantOwner);
router.delete("/:id", authMiddleware(["admin"]), deleteRestaurantOwner);


export default router