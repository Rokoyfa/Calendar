SET NAMES utf8mb4;

CREATE TABLE users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  email_verified_at DATETIME(3) NULL,
  password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(80) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT chk_users_email CHECK (email = LOWER(email) AND email LIKE '_%@_%._%'),
  CONSTRAINT chk_users_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  ip_address VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
  user_agent VARCHAR(255) NULL,
  PRIMARY KEY (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_sessions_expiry CHECK (expires_at > created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_tokens (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  purpose ENUM('verify_email', 'reset_password') NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  PRIMARY KEY (token_hash),
  KEY idx_user_tokens_user (user_id, purpose),
  CONSTRAINT fk_user_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_user_tokens_expiry CHECK (expires_at > created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  ip_address VARCHAR(45) CHARACTER SET ascii COLLATE ascii_bin NULL,
  attempted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  succeeded TINYINT(1) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_login_attempts_email (email, attempted_at),
  KEY idx_login_attempts_ip (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_preferences (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  theme ENUM('system', 'light', 'dark') NOT NULL DEFAULT 'system',
  default_view ENUM('day', 'week', 'month', 'year') NULL,
  mobile_default_view ENUM('day', 'week', 'month', 'year') NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_colors (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  color CHAR(7) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position TINYINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, color),
  UNIQUE KEY uq_user_colors_position (user_id, position),
  CONSTRAINT fk_user_colors_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_user_colors_color CHECK (color REGEXP '^#[0-9a-f]{6}$'),
  CONSTRAINT chk_user_colors_position CHECK (position < 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  code VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  hierarchy TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (code),
  UNIQUE KEY uq_roles_hierarchy (hierarchy),
  CONSTRAINT chk_roles_code CHECK (code REGEXP '^[a-z_]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  code VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  area ENUM('calendar', 'entries', 'members', 'team') NOT NULL,
  name VARCHAR(80) NOT NULL,
  position TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (code),
  UNIQUE KEY uq_permissions_position (position),
  CONSTRAINT chk_permissions_code CHECK (code REGEXP '^[a-z_]+$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  permission VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (role, permission),
  KEY idx_role_permissions_permission (permission),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role) REFERENCES roles (code),
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission) REFERENCES permissions (code),
  CONSTRAINT chk_role_permissions_owner CHECK (role <> 'owner')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teams (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(80) NOT NULL,
  personal_owner_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_teams_personal_owner (personal_owner_id),
  KEY idx_teams_created_by (created_by),
  CONSTRAINT fk_teams_personal_owner FOREIGN KEY (personal_owner_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_teams_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_teams_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE team_members (
  team_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  role VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (team_id, user_id),
  KEY idx_team_members_user (user_id),
  KEY idx_team_members_role (role),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_role FOREIGN KEY (role) REFERENCES roles (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE team_invitations (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  team_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  role VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'member',
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  invited_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  accepted_at DATETIME(3) NULL,
  accepted_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  revoked_at DATETIME(3) NULL,
  open_email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
    AS (IF(accepted_at IS NULL AND revoked_at IS NULL, email, NULL)) VIRTUAL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_invitations_token (token_hash),
  UNIQUE KEY uq_team_invitations_open (team_id, open_email),
  KEY idx_team_invitations_email (email),
  KEY idx_team_invitations_invited_by (invited_by),
  KEY idx_team_invitations_accepted_by (accepted_by),
  KEY idx_team_invitations_role (role),
  CONSTRAINT fk_team_invitations_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_invitations_invited_by FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_team_invitations_accepted_by FOREIGN KEY (accepted_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_team_invitations_role FOREIGN KEY (role) REFERENCES roles (code),
  CONSTRAINT chk_team_invitations_role CHECK (role <> 'owner'),
  CONSTRAINT chk_team_invitations_email CHECK (email = LOWER(email) AND email LIKE '_%@_%._%'),
  CONSTRAINT chk_team_invitations_expiry CHECK (expires_at > created_at),
  CONSTRAINT chk_team_invitations_state CHECK (accepted_at IS NULL OR revoked_at IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE calendars (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  team_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(80) NOT NULL,
  color VARCHAR(7) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'blue',
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_calendars_team (team_id, position),
  CONSTRAINT fk_calendars_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT chk_calendars_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT chk_calendars_color CHECK (color IN ('blue', 'red', 'green', 'yellow') OR color REGEXP '^#[0-9a-f]{6}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  calendar_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(2000) NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(7) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'blue',
  series_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  original_date DATE NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  updated_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_events_calendar_start (calendar_id, start_date),
  KEY idx_events_series (series_id, original_date),
  KEY idx_events_created_by (created_by),
  KEY idx_events_updated_by (updated_by),
  CONSTRAINT fk_events_calendar FOREIGN KEY (calendar_id) REFERENCES calendars (id) ON DELETE CASCADE,
  CONSTRAINT fk_events_series FOREIGN KEY (series_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_events_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_events_title CHECK (CHAR_LENGTH(TRIM(title)) > 0),
  CONSTRAINT chk_events_period CHECK (end_date > start_date OR (end_date = start_date AND end_time > start_time)),
  CONSTRAINT chk_events_color CHECK (color IN ('blue', 'red', 'green', 'yellow') OR color REGEXP '^#[0-9a-f]{6}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_recurrences (
  event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
  repeat_interval TINYINT UNSIGNED NOT NULL DEFAULT 1,
  monthly_mode ENUM('dayOfMonth', 'weekdayOfMonth', 'lastWeekdayOfMonth') NULL,
  until_date DATE NULL,
  occurrence_count SMALLINT UNSIGNED NULL,
  PRIMARY KEY (event_id),
  CONSTRAINT fk_event_recurrences_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT chk_event_recurrences_interval CHECK (repeat_interval BETWEEN 1 AND 99),
  CONSTRAINT chk_event_recurrences_monthly_mode CHECK ((frequency = 'monthly') = (monthly_mode IS NOT NULL)),
  CONSTRAINT chk_event_recurrences_end CHECK (until_date IS NULL OR occurrence_count IS NULL),
  CONSTRAINT chk_event_recurrences_count CHECK (occurrence_count IS NULL OR occurrence_count BETWEEN 1 AND 999)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_recurrence_weekdays (
  event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  weekday TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (event_id, weekday),
  CONSTRAINT fk_event_recurrence_weekdays_recurrence FOREIGN KEY (event_id) REFERENCES event_recurrences (event_id) ON DELETE CASCADE,
  CONSTRAINT chk_event_recurrence_weekdays_weekday CHECK (weekday <= 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_exclusions (
  event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  excluded_date DATE NOT NULL,
  PRIMARY KEY (event_id, excluded_date),
  CONSTRAINT fk_event_exclusions_recurrence FOREIGN KEY (event_id) REFERENCES event_recurrences (event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (code, name, description, hierarchy) VALUES
  ('owner', 'Owner', 'Leitet das Team und hat immer alle Rechte.', 0),
  ('admin', 'Administrator', 'Verwaltet Team, Mitglieder, Kalender und alle Termine. Kann das Team nicht löschen.', 10),
  ('manager', 'Verwalter', 'Verwaltet Kalender und alle Termine und lädt neue Mitglieder ein.', 20),
  ('editor', 'Redakteur', 'Legt Termine an und bearbeitet und löscht alle Termine.', 30),
  ('member', 'Mitglied', 'Legt Termine an und bearbeitet und löscht die eigenen.', 40),
  ('contributor', 'Beitragender', 'Legt Termine an und bearbeitet die eigenen, löscht aber nichts.', 50),
  ('viewer', 'Betrachter', 'Sieht die Kalender des Teams, ändert aber nichts.', 60);

INSERT INTO permissions (code, area, name, position) VALUES
  ('read_calendar', 'calendar', 'Kalender und Termine ansehen', 1),
  ('manage_calendars', 'calendar', 'Kalender anlegen, umbenennen, umfärben und löschen', 2),
  ('create_entry', 'entries', 'Termine anlegen', 10),
  ('update_own_entry', 'entries', 'Eigene Termine bearbeiten', 11),
  ('update_any_entry', 'entries', 'Alle Termine bearbeiten', 12),
  ('delete_own_entry', 'entries', 'Eigene Termine löschen', 13),
  ('delete_any_entry', 'entries', 'Alle Termine löschen', 14),
  ('invite_members', 'members', 'Mitglieder einladen und Einladungen widerrufen', 20),
  ('manage_members', 'members', 'Rollen vergeben und Mitglieder entfernen', 21),
  ('manage_team', 'team', 'Team umbenennen', 30),
  ('delete_team', 'team', 'Team löschen', 31);

INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'read_calendar'), ('admin', 'manage_calendars'),
  ('admin', 'create_entry'), ('admin', 'update_own_entry'), ('admin', 'update_any_entry'), ('admin', 'delete_own_entry'), ('admin', 'delete_any_entry'),
  ('admin', 'invite_members'), ('admin', 'manage_members'), ('admin', 'manage_team'),
  ('manager', 'read_calendar'), ('manager', 'manage_calendars'),
  ('manager', 'create_entry'), ('manager', 'update_own_entry'), ('manager', 'update_any_entry'), ('manager', 'delete_own_entry'), ('manager', 'delete_any_entry'),
  ('manager', 'invite_members'),
  ('editor', 'read_calendar'),
  ('editor', 'create_entry'), ('editor', 'update_own_entry'), ('editor', 'update_any_entry'), ('editor', 'delete_own_entry'), ('editor', 'delete_any_entry'),
  ('member', 'read_calendar'),
  ('member', 'create_entry'), ('member', 'update_own_entry'), ('member', 'delete_own_entry'),
  ('contributor', 'read_calendar'),
  ('contributor', 'create_entry'), ('contributor', 'update_own_entry'),
  ('viewer', 'read_calendar');
