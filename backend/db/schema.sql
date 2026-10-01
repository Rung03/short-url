-- Short URL schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS urls (
  id            SERIAL       PRIMARY KEY,
  original_url  TEXT         NOT NULL,
  short_code    VARCHAR(20)  NOT NULL UNIQUE,
  title         VARCHAR(255),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

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
