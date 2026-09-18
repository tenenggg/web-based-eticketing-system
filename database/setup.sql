-- =============================================================================
-- eTicketing — single MySQL setup (run once on a fresh server)
-- Seed password for admin / user1 / user2 / user3: password123
-- =============================================================================

CREATE DATABASE IF NOT EXISTS ticketing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ticketing;

-- Drop in FK-safe order (re-run = clean slate)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;




-- users
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL,
  CONSTRAINT chk_users_role CHECK (role IN ('admin', 'user'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- tickets
CREATE TABLE tickets (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number       VARCHAR(20)  NOT NULL UNIQUE,
  user_id             INT          NOT NULL,
  assigned_admin_id   INT          NULL,
  subject             VARCHAR(255) NOT NULL,
  description         TEXT         NULL,
  category            VARCHAR(50)  NOT NULL DEFAULT 'General',
  status              VARCHAR(20)  NOT NULL DEFAULT 'Open',
  priority            VARCHAR(10)  NOT NULL DEFAULT 'Medium',
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at           DATETIME     NULL,
  time_taken_minutes  INT          NULL COMMENT 'Filled when ticket closes',
  CONSTRAINT fk_tickets_user  FOREIGN KEY (user_id)           REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_tickets_category CHECK (category IN (
    'General', 'Technical', 'Billing', 'Bug Report', 'Other'
  )),
  CONSTRAINT chk_tickets_status CHECK (status IN (
    'Open', 'In Progress', 'On-Hold', 'Closed'
  )),
  CONSTRAINT chk_tickets_priority CHECK (priority IN (
    'Low', 'Medium', 'High', 'Urgent'
  ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- messages (thread + attachments)
CREATE TABLE messages (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT          NOT NULL,
  sender_id     INT          NOT NULL,
  content       TEXT         NOT NULL,
  message_kind  VARCHAR(30)  NOT NULL DEFAULT 'user_answer',
  is_read       TINYINT(1)   NOT NULL DEFAULT 0,
  file_url      VARCHAR(512) NULL,
  file_name     VARCHAR(255) NULL,
  original_name VARCHAR(255) NULL,
  mime_type     VARCHAR(100) NULL,
  file_size     INT UNSIGNED NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT chk_messages_kind CHECK (message_kind IN (
    'user_request', 'user_answer', 'admin_question', 'admin_solution', 'ticket_assigned',
    'resolution_prompt', 'user_solved', 'user_not_solved'
  ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- Auto-compute resolution time when ticket first closes
DROP TRIGGER IF EXISTS calc_time_taken;

DELIMITER $$

CREATE TRIGGER calc_time_taken
BEFORE UPDATE ON tickets
FOR EACH ROW
BEGIN
  IF NEW.closed_at IS NOT NULL AND OLD.closed_at IS NULL THEN
    SET NEW.time_taken_minutes = TIMESTAMPDIFF(MINUTE, NEW.created_at, NEW.closed_at);
  END IF;
END$$

DELIMITER ;




-- Seed accounts (password: password123)
INSERT INTO users (username, password_hash, role) VALUES
  ('admin', '$2b$10$n6yoARjUhbpX/GTF9SAwzOaHm9hncqtYIAxzlDzr319IxZ0TIchom', 'admin'),
  ('user1', '$2b$10$n6yoARjUhbpX/GTF9SAwzOaHm9hncqtYIAxzlDzr319IxZ0TIchom', 'user'),
  ('user2', '$2b$10$n6yoARjUhbpX/GTF9SAwzOaHm9hncqtYIAxzlDzr319IxZ0TIchom', 'user'),
  ('user3', '$2b$10$n6yoARjUhbpX/GTF9SAwzOaHm9hncqtYIAxzlDzr319IxZ0TIchom', 'user');
