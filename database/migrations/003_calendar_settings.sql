SET NAMES utf8mb4;

ALTER TABLE teams
  ADD COLUMN description VARCHAR(500) NOT NULL DEFAULT '' AFTER name;

CREATE TABLE user_calendar_settings (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  calendar_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  show_in_personal TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, calendar_id),
  KEY idx_user_calendar_settings_calendar (calendar_id),
  CONSTRAINT fk_user_calendar_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_calendar_settings_calendar FOREIGN KEY (calendar_id) REFERENCES calendars (id) ON DELETE CASCADE,
  CONSTRAINT chk_user_calendar_settings_show CHECK (show_in_personal IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

CREATE TRIGGER trg_user_calendar_settings_before_insert
BEFORE INSERT ON user_calendar_settings
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM calendars c
    JOIN teams t ON t.id = c.team_id AND t.personal_owner_id IS NULL
    JOIN team_members m ON m.team_id = t.id AND m.user_id = NEW.user_id
    WHERE c.id = NEW.calendar_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Einstellungen gibt es nur für Team-Kalender, in denen der Nutzer Mitglied ist.';
  END IF;
END$$

CREATE TRIGGER trg_user_calendar_settings_before_update
BEFORE UPDATE ON user_calendar_settings
FOR EACH ROW
BEGIN
  IF NEW.user_id <> OLD.user_id OR NEW.calendar_id <> OLD.calendar_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Eine Einstellung kann nicht verschoben werden. Bitte löschen und neu anlegen.';
  END IF;
END$$

CREATE TRIGGER trg_team_members_after_delete
AFTER DELETE ON team_members
FOR EACH ROW
BEGIN
  DELETE s
  FROM user_calendar_settings s
  JOIN calendars c ON c.id = s.calendar_id
  WHERE s.user_id = OLD.user_id AND c.team_id = OLD.team_id;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW user_calendars AS
SELECT
  m.user_id,
  c.id AS calendar_id,
  c.name,
  c.color,
  c.position,
  t.id AS team_id,
  t.name AS team_name,
  IF(t.personal_owner_id IS NULL, 'team', 'personal') AS kind,
  m.role,
  t.description,
  IF(t.personal_owner_id IS NULL, COALESCE(s.show_in_personal, 1), 1) AS show_in_personal
FROM team_members m
JOIN teams t ON t.id = m.team_id
JOIN calendars c ON c.team_id = t.id
LEFT JOIN user_calendar_settings s ON s.user_id = m.user_id AND s.calendar_id = c.id;
