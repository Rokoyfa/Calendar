SET NAMES utf8mb4;

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
  m.role
FROM team_members m
JOIN teams t ON t.id = m.team_id
JOIN calendars c ON c.team_id = t.id;

DROP TRIGGER IF EXISTS trg_team_members_after_delete;
DROP TRIGGER IF EXISTS trg_user_calendar_settings_before_update;
DROP TRIGGER IF EXISTS trg_user_calendar_settings_before_insert;
DROP TABLE IF EXISTS user_calendar_settings;
ALTER TABLE teams DROP COLUMN description;
