-- Short URL schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL       PRIMARY KEY,
  username       VARCHAR(30)  NOT NULL UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,
  role           VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS urls (
  id            SERIAL       PRIMARY KEY,
  original_url  TEXT         NOT NULL,
  short_code    VARCHAR(20)  NOT NULL UNIQUE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- title was removed; drop it from databases created before that
ALTER TABLE urls DROP COLUMN IF EXISTS title;

-- Link owner (added with user accounts)
ALTER TABLE urls ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_urls_user ON urls (user_id);

CREATE TABLE IF NOT EXISTS clicks (
  id           BIGSERIAL    PRIMARY KEY,
  url_id       INTEGER      NOT NULL REFERENCES urls (id) ON DELETE CASCADE,
  clicked_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  ip_hash      VARCHAR(64),
  user_agent   VARCHAR(500),
  referrer     VARCHAR(500),
  device_type  VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_clicks_url_time ON clicks (url_id, clicked_at);
