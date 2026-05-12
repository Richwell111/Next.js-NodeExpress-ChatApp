import { Router } from "express";
import {
  handleListChatUsers,
  handleListDirectMessages,
} from "../modules/chat/chat.controller.js";

export const chatRouter = Router();

chatRouter.get("/users", handleListChatUsers);

chatRouter.get(
  "/conversations/:otherUserId/messages",
  handleListDirectMessages
);
