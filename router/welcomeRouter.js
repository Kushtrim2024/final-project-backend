import ex from "express";
import { welcomeController } from "../controller/welcomeController.js";

export const welcomeRouter = ex.Router();

welcomeRouter.get("/", welcomeController);
