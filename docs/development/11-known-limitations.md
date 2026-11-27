# Bekannte Einschränkungen

- Nur localStorage, keine Synchronisierung zwischen Geräten oder Browsern
- Serien-Aktionen bestehen aus mehreren einzelnen Speichervorgängen. Bricht einer davon ab, kann eine Serie teilweise geändert sein.
- Eigene Farben lassen sich noch nicht wieder entfernen
- Datums- und Zeitfelder (`<input type="date">`, `type="time"`) zeigen das Format der Browser- bzw. Systemsprache, nicht die gewählte Sprache
- Meldungen zu ungültigen Eingaben (`invalidInput`), die erst der Server erkennt, kommen auf Englisch
- Beim ersten Anmelden werden Einstellungen und Farben aus dem Browser nicht ins Konto übernommen, das Konto startet mit den Standardwerten

---

[← Zurück](10-project-structure.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](12-next-steps.md)
