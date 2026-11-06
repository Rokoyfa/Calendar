SET NAMES utf8mb4;

DELIMITER $$

CREATE TRIGGER trg_users_after_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  DECLARE personal_team_id CHAR(36) CHARACTER SET ascii DEFAULT UUID();
  INSERT INTO teams (id, name, personal_owner_id, created_by)
    VALUES (personal_team_id, 'Persönlich', NEW.id, NEW.id);
  INSERT INTO team_members (team_id, user_id, role)
    VALUES (personal_team_id, NEW.id, 'owner');
  INSERT INTO calendars (id, team_id, name)
    VALUES (UUID(), personal_team_id, 'Persönlich');
  INSERT INTO user_preferences (user_id)
    VALUES (NEW.id);
END$$

CREATE TRIGGER trg_users_before_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM team_members own
    JOIN teams t ON t.id = own.team_id AND t.personal_owner_id IS NULL
    WHERE own.user_id = OLD.id
      AND own.role = 'owner'
      AND NOT EXISTS (
        SELECT 1 FROM team_members other
        WHERE other.team_id = own.team_id AND other.role = 'owner' AND other.user_id <> OLD.id
      )
      AND EXISTS (
        SELECT 1 FROM team_members other
        WHERE other.team_id = own.team_id AND other.user_id <> OLD.id
      )
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Der Nutzer ist einziger Owner eines Teams mit weiteren Mitgliedern. Bitte zuerst die Leitung übergeben.';
  END IF;

  DELETE t
  FROM teams t
  JOIN team_members own ON own.team_id = t.id AND own.user_id = OLD.id
  WHERE t.personal_owner_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM team_members other
      WHERE other.team_id = t.id AND other.user_id <> OLD.id
    );
END$$

CREATE TRIGGER trg_teams_before_insert
BEFORE INSERT ON teams
FOR EACH ROW
BEGIN
  IF NEW.personal_owner_id IS NULL AND NEW.created_by IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ein Team braucht einen Ersteller (created_by), der Owner wird.';
  END IF;
END$$

CREATE TRIGGER trg_teams_after_insert
AFTER INSERT ON teams
FOR EACH ROW
BEGIN
  IF NEW.personal_owner_id IS NULL THEN
    INSERT INTO team_members (team_id, user_id, role)
      VALUES (NEW.id, NEW.created_by, 'owner');
    INSERT INTO calendars (id, team_id, name)
      VALUES (UUID(), NEW.id, NEW.name);
  END IF;
END$$

CREATE TRIGGER trg_teams_before_update
BEFORE UPDATE ON teams
FOR EACH ROW
BEGIN
  IF NOT (NEW.personal_owner_id <=> OLD.personal_owner_id) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ein Team kann nicht nachträglich persönlich oder geteilt werden.';
  END IF;
END$$

CREATE TRIGGER trg_teams_before_delete
BEFORE DELETE ON teams
FOR EACH ROW
BEGIN
  IF OLD.personal_owner_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Das persönliche Team wird nur zusammen mit dem Nutzer gelöscht.';
  END IF;
END$$

CREATE TRIGGER trg_team_members_before_insert
BEFORE INSERT ON team_members
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM teams
    WHERE id = NEW.team_id
      AND personal_owner_id IS NOT NULL
      AND (personal_owner_id <> NEW.user_id OR NEW.role <> 'owner')
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ins persönliche Team kann niemand weiteres aufgenommen werden.';
  END IF;
END$$

CREATE TRIGGER trg_team_members_before_update
BEFORE UPDATE ON team_members
FOR EACH ROW
BEGIN
  IF NEW.team_id <> OLD.team_id OR NEW.user_id <> OLD.user_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Eine Mitgliedschaft kann nicht verschoben werden. Bitte löschen und neu anlegen.';
  END IF;
  IF OLD.role = 'owner' AND NEW.role <> 'owner' AND NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = OLD.team_id AND role = 'owner' AND user_id <> OLD.user_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ein Team braucht mindestens einen Owner.';
  END IF;
END$$

CREATE TRIGGER trg_team_members_before_delete
BEFORE DELETE ON team_members
FOR EACH ROW
BEGIN
  IF OLD.role = 'owner' AND NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = OLD.team_id AND role = 'owner' AND user_id <> OLD.user_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ein Team braucht mindestens einen Owner. Bitte zuerst die Leitung übergeben oder das Team löschen.';
  END IF;
END$$

CREATE TRIGGER trg_team_invitations_before_insert
BEFORE INSERT ON team_invitations
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM teams WHERE id = NEW.team_id AND personal_owner_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'In das persönliche Team kann nicht eingeladen werden.';
  END IF;
END$$

CREATE TRIGGER trg_team_invitations_before_update
BEFORE UPDATE ON team_invitations
FOR EACH ROW
BEGIN
  IF OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
    IF OLD.revoked_at IS NOT NULL THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Die Einladung wurde widerrufen.';
    END IF;
    IF OLD.expires_at <= UTC_TIMESTAMP(3) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Die Einladung ist abgelaufen.';
    END IF;
    IF NEW.accepted_by IS NULL OR NOT EXISTS (
      SELECT 1 FROM users WHERE id = NEW.accepted_by AND email = NEW.email
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Die Einladung gilt für eine andere E-Mail-Adresse.';
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_team_invitations_after_update
AFTER UPDATE ON team_invitations
FOR EACH ROW
BEGIN
  IF OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
    INSERT INTO team_members (team_id, user_id, role)
      VALUES (NEW.team_id, NEW.accepted_by, NEW.role)
      ON DUPLICATE KEY UPDATE role = role;
  END IF;
END$$

CREATE TRIGGER trg_events_before_insert
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
  IF (NEW.series_id IS NULL) <> (NEW.original_date IS NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'series_id und original_date müssen zusammen gesetzt oder beide leer sein.';
  END IF;
  IF NEW.series_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM events
    JOIN event_recurrences r ON r.event_id = events.id
    WHERE events.id = NEW.series_id AND events.calendar_id = NEW.calendar_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'series_id muss auf eine Serie im selben Kalender zeigen.';
  END IF;
END$$

CREATE TRIGGER trg_events_before_update
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
  IF (NEW.series_id IS NULL) <> (NEW.original_date IS NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'series_id und original_date müssen zusammen gesetzt oder beide leer sein.';
  END IF;
  IF NEW.series_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM events
    JOIN event_recurrences r ON r.event_id = events.id
    WHERE events.id = NEW.series_id AND events.id <> NEW.id AND events.calendar_id = NEW.calendar_id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'series_id muss auf eine Serie im selben Kalender zeigen.';
  END IF;
  IF NEW.original_date IS NOT NULL AND EXISTS (SELECT 1 FROM event_recurrences WHERE event_id = NEW.id) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ein herausgelöster Termin kann selbst keine Serie sein.';
  END IF;
  IF NEW.start_date <> OLD.start_date AND EXISTS (
    SELECT 1 FROM event_recurrences WHERE event_id = NEW.id AND until_date < NEW.start_date
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Das Ende der Wiederholung darf nicht vor dem Beginn liegen.';
  END IF;
  SET NEW.version = OLD.version + 1;
END$$

CREATE TRIGGER trg_event_recurrences_before_insert
BEFORE INSERT ON event_recurrences
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE id = NEW.event_id AND original_date IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Ein herausgelöster Termin kann selbst keine Serie sein.';
  END IF;
  IF EXISTS (SELECT 1 FROM events WHERE id = NEW.event_id AND NEW.until_date < start_date) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Das Ende der Wiederholung darf nicht vor dem Beginn liegen.';
  END IF;
END$$

CREATE TRIGGER trg_event_recurrences_after_insert
AFTER INSERT ON event_recurrences
FOR EACH ROW
BEGIN
  UPDATE events SET version = version + 1 WHERE id = NEW.event_id;
END$$

CREATE TRIGGER trg_event_recurrences_before_update
BEFORE UPDATE ON event_recurrences
FOR EACH ROW
BEGIN
  IF NEW.event_id <> OLD.event_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Eine Wiederholung kann nicht zu einem anderen Termin verschoben werden.';
  END IF;
  IF EXISTS (SELECT 1 FROM events WHERE id = NEW.event_id AND NEW.until_date < start_date) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Das Ende der Wiederholung darf nicht vor dem Beginn liegen.';
  END IF;
END$$

CREATE TRIGGER trg_event_recurrences_after_update
AFTER UPDATE ON event_recurrences
FOR EACH ROW
BEGIN
  IF NEW.frequency <> 'weekly' THEN
    DELETE FROM event_recurrence_weekdays WHERE event_id = NEW.event_id;
  END IF;
  UPDATE events SET version = version + 1 WHERE id = NEW.event_id;
END$$

CREATE TRIGGER trg_event_recurrences_before_delete
BEFORE DELETE ON event_recurrences
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE series_id = OLD.event_id) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Die Serie hat herausgelöste Termine. Bitte diese zuerst löschen.';
  END IF;
END$$

CREATE TRIGGER trg_event_recurrences_after_delete
AFTER DELETE ON event_recurrences
FOR EACH ROW
BEGIN
  UPDATE events SET version = version + 1 WHERE id = OLD.event_id;
END$$

CREATE TRIGGER trg_event_recurrence_weekdays_before_insert
BEFORE INSERT ON event_recurrence_weekdays
FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM event_recurrences WHERE event_id = NEW.event_id AND frequency = 'weekly') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Wochentage gibt es nur bei wöchentlicher Wiederholung.';
  END IF;
END$$

CREATE TRIGGER trg_event_recurrence_weekdays_after_insert
AFTER INSERT ON event_recurrence_weekdays
FOR EACH ROW
BEGIN
  UPDATE events SET version = version + 1 WHERE id = NEW.event_id;
END$$

CREATE TRIGGER trg_event_recurrence_weekdays_after_delete
AFTER DELETE ON event_recurrence_weekdays
FOR EACH ROW
BEGIN
  UPDATE events SET version = version + 1 WHERE id = OLD.event_id;
END$$

CREATE TRIGGER trg_event_exclusions_after_insert
AFTER INSERT ON event_exclusions
FOR EACH ROW
BEGIN
  UPDATE events SET version = version + 1 WHERE id = NEW.event_id;
END$$

CREATE TRIGGER trg_event_exclusions_after_delete
AFTER DELETE ON event_exclusions
FOR EACH ROW
BEGIN
  UPDATE events SET version = version + 1 WHERE id = OLD.event_id;
END$$

DELIMITER ;

CREATE VIEW user_calendars AS
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

CREATE VIEW user_team_permissions AS
SELECT m.user_id, m.team_id, p.code AS permission
FROM team_members m
JOIN teams t ON t.id = m.team_id
JOIN permissions p ON m.role = 'owner'
WHERE t.personal_owner_id IS NULL OR p.area IN ('calendar', 'entries')
UNION ALL
SELECT m.user_id, m.team_id, rp.permission
FROM team_members m
JOIN role_permissions rp ON rp.role = m.role;
