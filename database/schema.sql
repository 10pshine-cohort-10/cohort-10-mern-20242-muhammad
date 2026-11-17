-- Notes Management Application — Database Schema
-- MySQL 8.x, InnoDB engine, utf8mb4 charset

CREATE DATABASE IF NOT EXISTS notes_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE notes_app;

-- ─────────────────────────────────────────────────────────────────────────────
--  USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)    NULL,
  username      VARCHAR(50)     NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),
  UNIQUE KEY uq_users_username (username),
  INDEX idx_users_email        (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
--  NOTES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  title         VARCHAR(255)    NOT NULL,
  content       LONGTEXT        NOT NULL,
  content_text  LONGTEXT        NOT NULL,
  category      VARCHAR(100)    NOT NULL DEFAULT 'General',
  tags          VARCHAR(255)    NOT NULL DEFAULT '',
  is_pinned     TINYINT(1)      NOT NULL DEFAULT 0,
  is_favorite   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_notes_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Individual indexes for fast joins, filters, and ordering
  INDEX idx_notes_user_id      (user_id),
  INDEX idx_notes_updated_at   (updated_at),
  -- Composite index: fast per-user note listing sorted by pin + date
  INDEX idx_notes_user_updated (user_id, updated_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
--  TEST DATABASE (for running integration tests)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS notes_app_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE notes_app_test;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)    NULL,
  username      VARCHAR(50)     NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),
  UNIQUE KEY uq_users_username (username),
  INDEX idx_users_email        (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notes (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  title         VARCHAR(255)    NOT NULL,
  content       LONGTEXT        NOT NULL,
  content_text  LONGTEXT        NOT NULL,
  category      VARCHAR(100)    NOT NULL DEFAULT 'General',
  tags          VARCHAR(255)    NOT NULL DEFAULT '',
  is_pinned     TINYINT(1)      NOT NULL DEFAULT 0,
  is_favorite   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notes_user_test
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notes_user_id      (user_id),
  INDEX idx_notes_updated_at   (updated_at),
  INDEX idx_notes_user_updated (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
