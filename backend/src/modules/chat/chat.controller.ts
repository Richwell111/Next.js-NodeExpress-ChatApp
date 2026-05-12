import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { getUserFromClerk } from "../users/user.service.js";
import {
  listChatUsers,
  listDirectMessages,
} from "./chat.service.js";

export async function handleListChatUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const profile = await getUserFromClerk(auth.userId);
    const currentUserId = profile.user.id as number;

    const users = await listChatUsers(currentUserId);

    res.json({ data: users });
  } catch (err) {
    next(err);
  }
}

export async function handleListDirectMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const profile = await getUserFromClerk(auth.userId);
    const currentUserId = profile.user.id as number;

    const rawOtherUserId = req.params.otherUserId;
    const otherUserId = Number(rawOtherUserId);

    const limitParam = req.query.limit;
    const limit =
      typeof limitParam === "string" ? parseInt(limitParam, 10) : 100;

    const messages = await listDirectMessages({
      userId: currentUserId,
      otherUserId,
      limit: limit || 50,
    });

    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
}
