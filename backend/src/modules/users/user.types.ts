// schema DB vs that we are going to expose to api

export type Nullable<T> = T | null;

export type UserRow = {
  id: number;
  clerk_user_id: string;
  display_name: Nullable<string>;
  handle: Nullable<string>;
  avatar_url: Nullable<string>;
  bio: Nullable<string>;
  created_at: Date;
  updated_at: Date;
};

export type User = {
  id: number;
  clerkUserId: string;
  displayName: Nullable<string>;
  handle: Nullable<string>;
  avatarUrl: Nullable<string>;
  bio: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProfile = {
  user: User;
  clerkEmail: Nullable<string>;
  clerkFullName: Nullable<string>;
};

export type UserProfileResponse = {
  id: number;
  clerkUserId: string;
  displayName: Nullable<string>;
  email: Nullable<string>;
  handle: Nullable<string>;
  avatarUrl: Nullable<string>;
  bio: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserProfileResponse(
  profile: UserProfile
): UserProfileResponse {
  const { user, clerkEmail, clerkFullName } = profile;

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: clerkEmail ?? null,
    displayName: user.displayName ?? clerkFullName ?? null,
    handle: user.handle ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
