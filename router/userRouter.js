import ex from "express";
import { loginController, registerController } from "../controller/userController.js";


export const userRouter = ex.Router();

userRouter.post("/register", registerController);
userRouter.post("/login", loginController);