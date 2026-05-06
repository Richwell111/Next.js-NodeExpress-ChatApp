import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuth } from "../../config/clerk.js";
import { UnauthorizedError } from "../../lib/errors.js";
import {
  getUserFromClerk,
  updateUserProfile,
} from "./user.service.js";
import { toUserProfileResponse } from "./user.types.js";

// Validation schema for updating user profile
const UserProfileUpdateSchema = z.object({
  displayName: z.string().trim().max(50).optional(),
  handle: z.string().trim().max(30).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.url("Avatar must be valid url").optional(),
});

/**
 * Controller to handle user-related requests
 */

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const profile = await getUserFromClerk(auth.userId);
    const response = toUserProfileResponse(profile);

    res.json({ data: response });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const parsedBody = UserProfileUpdateSchema.parse(req.body);

    // Clean up optional fields: ensure empty strings or just whitespace are treated as undefined
    const displayName =
      parsedBody.displayName && parsedBody.displayName.trim().length > 0
        ? parsedBody.displayName.trim()
        : undefined;

    const handle =
      parsedBody.handle && parsedBody.handle.trim().length > 0
        ? parsedBody.handle.trim()
        : undefined;

    const bio =
      parsedBody.bio && parsedBody.bio.trim().length > 0
        ? parsedBody.bio.trim()
        : undefined;

    const avatarUrl =
      parsedBody.avatarUrl && parsedBody.avatarUrl.trim().length > 0
        ? parsedBody.avatarUrl.trim()
        : undefined;

    const profile = await updateUserProfile({
      clerkUserId: auth.userId,
      displayName,
      handle,
      bio,
      avatarUrl,
    });

    const response = toUserProfileResponse(profile);

    res.json({ data: response });
  } catch (err) {
    next(err);
  }
};
