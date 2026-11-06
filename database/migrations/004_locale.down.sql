SET NAMES utf8mb4;

ALTER TABLE user_preferences
  DROP CONSTRAINT chk_user_preferences_locale,
  DROP COLUMN locale;
