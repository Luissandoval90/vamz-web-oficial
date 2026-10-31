PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_expiry_idx ON auth_rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS resource_stats (
  resource_id TEXT PRIMARY KEY NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0 CHECK(views >= 0),
  downloads INTEGER NOT NULL DEFAULT 0 CHECK(downloads >= 0)
);
CREATE TABLE IF NOT EXISTS resource_events (
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('view', 'download')),
  visitor_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(resource_id,kind,visitor_hash)
);
CREATE INDEX IF NOT EXISTS resource_events_expiry_idx ON resource_events(expires_at);
CREATE TABLE IF NOT EXISTS resource_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS resource_reviews_owner_idx ON resource_reviews(resource_id,user_id);
CREATE INDEX IF NOT EXISTS resource_reviews_public_idx ON resource_reviews(resource_id,is_approved,created_at);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  description TEXT,
  cover_path TEXT,
  file_size INTEGER NOT NULL DEFAULT 0,
  cover_size INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS resources_user_id_idx ON resources(user_id);
CREATE INDEX IF NOT EXISTS resources_is_published_idx ON resources(is_published);
CREATE TABLE IF NOT EXISTS minecraft_versions (
  resource_id TEXT PRIMARY KEY NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  edition TEXT NOT NULL,
  platform TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
