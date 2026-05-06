import { query } from "../../db/db.js";
import { User, UserRow } from "./user.types.js";

/**
 * Maps a database row (UserRow) to a domain model (User).
 * This "hydration" step decouples our database schema (snake_case)
 * from our application logic (camelCase).
 */
function hydrateUser(row: UserRow): User {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    handle: row.handle,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Synchronizes a user from Clerk into our local database.
 * Uses an "UPSERT" pattern (INSERT ... ON CONFLICT) to either create the user
 * or update their profile if they already exist, ensuring idempotency.
 */
export async function upsertUserFromClerkProfile(params: {
  clerkUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
}): Promise<User> {
  const { clerkUserId, displayName, avatarUrl } = params;

  const result = await query<UserRow>(
    `
        INSERT INTO users (clerk_user_id, display_name, avatar_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (clerk_user_id)
        DO UPDATE SET
           display_name = EXCLUDED.display_name,
           avatar_url   = EXCLUDED.avatar_url,
           updated_at   = NOW()
        RETURNING
           id,
           clerk_user_id,
           display_name,
           handle,
           avatar_url,
           bio,
           created_at,
           updated_at
        `,
    [clerkUserId, displayName, avatarUrl]
  );

  // Safety check for strict indexing (noUncheckedIndexedAccess)
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to upsert user");
  }

  return hydrateUser(row);
}

/**
 * Updates a user's profile with provided fields.
 * Builds a dynamic SQL statement so we only update the columns that were actually passed.
 */
export async function repoUpdateUserProfile(params: {
  clerkUserId: string;
  displayName?: string | undefined;
  handle?: string | undefined;
  bio?: string | undefined;
  avatarUrl?: string | undefined;
}): Promise<User> {
  const { clerkUserId, displayName, handle, bio, avatarUrl } = params;

  const setClauses: string[] = [];
  const values: unknown[] = [clerkUserId]; // $1 is reserved for the WHERE clause
  let idx = 2; // Incremental index for dynamic parameters ($2, $3, etc.)

  // Dynamically push only defined fields into the query
  if (displayName !== undefined) {
    setClauses.push(`display_name = $${idx++}`);
    values.push(displayName);
  }

  if (handle !== undefined) {
    setClauses.push(`handle = $${idx++}`);
    values.push(handle);
  }

  if (bio !== undefined) {
    setClauses.push(`bio = $${idx++}`);
    values.push(bio);
  }

  if (avatarUrl !== undefined) {
    setClauses.push(`avatar_url = $${idx++}`);
    values.push(avatarUrl);
  }

  // Prevent running an UPDATE with zero changes (SQL syntax error)
  if (setClauses.length === 0) {
    throw new Error("No fields provided for update");
  }

  // Always refresh the updated_at timestamp
  setClauses.push(`updated_at = NOW()`);

  const result = await query<UserRow>(
    `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE clerk_user_id = $1
      RETURNING
        id,
        clerk_user_id,
        display_name,
        handle,
        avatar_url,
        bio,
        created_at,
        updated_at
      `,
    values
  );

  // Validate that the user actually existed and was updated
  const row = result.rows[0];
  if (!row) {
    throw new Error(`no user found for clerk user id= ${clerkUserId}`);
  }

  return hydrateUser(row);
}
