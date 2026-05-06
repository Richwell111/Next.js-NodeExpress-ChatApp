import { Router } from "express";
import * as userController from "../modules/users/user.controller.js";

export const userRouter = Router();

// get -> /api/me
userRouter.get("/", userController.getMe);

// patch -> /api/me
userRouter.patch("/", userController.updateMe);
