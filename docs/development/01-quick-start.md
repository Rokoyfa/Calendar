# Schnellstart

```bash
npm install
cp .example.env .env
npm run dev
```

Unter Windows (PowerShell) statt `cp`: `Copy-Item .example.env .env`. Ohne `.env` startet die App mit den Standardwerten im localStorage-Modus.

| Befehl            | Beschreibung                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Entwicklungsserver starten                  |
| `npm run build`   | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | Produktions-Build lokal ansehen             |
| `npm run lint`    | ESLint und Prüfung der Modulgrenzen (`lint:imports`) |
| `npm run build:lib` | Bibliothek bauen: npm-Paket nach `dist-lib/npm/`, Script-Datei nach `dist-lib/cdn/` |
| `npm run typecheck` | Nur Typprüfung (App und Browser-Tests) |
| `npm test` | Unit-Tests (Vitest) |
| `npm run test:e2e` | Browser-Tests (Playwright) gegen das TestBE, siehe [Browser-Tests](03-browser-tests.md) |
| `npm run check` | Alles vor einem Commit: Typen, ESLint, Modulgrenzen, Unit-Tests, beide Builds, mit Zusammenfassung |
| `npm run check:all` | Wie `check`, zusätzlich die Browser-Tests |
| `npm publish` | Veröffentlichen, prüft vorher Lint und Typen und baut die Bibliothek (siehe [Veröffentlichen](04-publishing.md)) |

**Technik:** React 19, React Router 8, TypeScript 6, Vite 8, ESLint. Voraussetzung ist **Node.js 22.22 oder neuer** (verlangt von React Router 8).

---

[Inhalt](../../DEVELOPMENT.md) · [Weiter →](02-embedding.md)
