// router/contactRouter.js
import express from "express";
import { sendMessage } from "../controller/contactController.js";

const router = express.Router();

router.post("/", sendMessage);

export default router;
