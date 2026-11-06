SET NAMES utf8mb4;

ALTER TABLE user_preferences
  ADD COLUMN locale VARCHAR(35) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'auto' AFTER mobile_default_view,
  ADD CONSTRAINT chk_user_preferences_locale CHECK (locale REGEXP '^(auto|[a-z]{2,3}(-[A-Za-z0-9]{2,8})*)$');
