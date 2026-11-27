# Kalender – Entwicklung

Einbettbarer Kalender (`@rokoyfa/calendar`), gebaut mit React, TypeScript und Vite. Diese Datei beschreibt Aufbau, Konfiguration und Verhalten im Detail. Die öffentliche Dokumentation für Nutzer des Pakets steht auf Englisch in der [README.md](README.md) (Überblick) und im [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) (Einbindung, Konfiguration, Typen, Backend), Änderungen je Version im [CHANGELOG.md](CHANGELOG.md).

- **Ohne Anmeldung:** Termine werden im Browser gespeichert (localStorage).
- **Mit Anmeldung:** Termine, Einstellungen und Farben liegen auf einem Server, der [`api/openapi.yaml`](api/openapi.yaml) umsetzt.
- **Team-Modus:** gemeinsame Kalender mit Rollen und Einladungen per E-Mail.
- **Einbettung:** als React-Komponente oder als `<calendar-widget>` per Script-Tag, auch mit Tenants und Anmeldung über den Gastgeber.

Das Test-Backend (`TestBE`) dient der Entwicklung. Das produktive Backend ist nicht Teil dieses Projekts.

**Inhalt**

1. [Schnellstart](docs/development/01-quick-start.md)
2. [Einbetten](docs/development/02-embedding.md)
3. [Browser-Tests](docs/development/03-browser-tests.md)
4. [Veröffentlichen](docs/development/04-publishing.md)
5. [Konfiguration (.env)](docs/development/05-configuration-env.md)
6. [API-Client](docs/development/06-api-client.md)
7. [Anmeldung](docs/development/07-sign-in.md)
8. [Funktionen](docs/development/08-features.md)
9. [Datenspeicherung](docs/development/09-data-storage.md)
10. [Projektstruktur](docs/development/10-project-structure.md)
11. [Bekannte Einschränkungen](docs/development/11-known-limitations.md)
12. [Nächste Schritte](docs/development/12-next-steps.md)
