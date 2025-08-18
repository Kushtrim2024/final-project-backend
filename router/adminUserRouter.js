import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  getUserById,
  deleteUser
} from "../controller/adminController.js";

const router = express.Router();

router.get("/", authMiddleware(["admin"]), getAllUsers);
router.get("/:id", authMiddleware(["admin"]), getUserById);
router.delete("/:id", authMiddleware(["admin"]), deleteUser);

export default router;
