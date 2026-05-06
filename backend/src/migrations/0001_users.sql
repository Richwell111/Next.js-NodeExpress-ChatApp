CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    clerk_user_id TEXT NOT NULL UNIQUE,

    display_name TEXT,

    handle TEXT UNIQUE,

    avatar_url TEXT,

    bio TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--  Indexes

-- Fast lookup by Clerk ID (VERY IMPORTANT)
-- CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id 
-- ON users(clerk_user_id);

-- Fast lookup by handle (username search)
-- CREATE INDEX IF NOT EXISTS idx_users_handle 
-- ON users(handle);

-- Optional: sort/filter by creation time
CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON users(created_at);