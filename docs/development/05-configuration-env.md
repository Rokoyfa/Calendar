# Konfiguration (.env)

Die App wird über Umgebungsvariablen eingestellt. Vite liest sie aus diesen Dateien:

| Datei                | Im Git | Zweck                                                         |
| -------------------- | ------ | ------------------------------------------------------------- |
| `.example.env`       | ja     | Vorlage mit allen Variablen und Standardwerten                |
| `.env`               | nein   | Eigene lokale Werte, Kopie der Vorlage                        |
| `.env.[mode]`        | ja     | Optional: Werte für einen Modus, z. B. `.env.production`     |
| `.env.local`, `.env.[mode].local` | nein | Optional: persönliche Überschreibungen, haben Vorrang |

## Variablen

| Variable              | Standard                | Beschreibung |
| --------------------- | ----------------------- | ------------ |
| `VITE_STORAGE_MODE`   | `local`                 | `local` speichert im localStorage, `remote` über die API. Wird ignoriert, wenn `VITE_FEATURE_AUTH=true` ist, dann entscheidet die Anmeldung. |
| `VITE_API_BASE_URL`   | `/api`                  | Adresse der API. Relativ (`/api`) oder absolut (`https://api.example.com`). Wird nur im Modus `remote` genutzt. |
| `VITE_API_TIMEOUT_MS` | `10000`                 | Maximale Wartezeit pro API-Anfrage in Millisekunden |
| `VITE_FEATURE_AUTH`   | `false`                 | Schaltet Anmeldung, Registrierung und Abmeldung ein (siehe [Anmeldung](07-sign-in.md)). Braucht das Backend mit den `/auth`-Endpunkten. |
| `VITE_FEATURE_TEAMS`  | `true`                  | Team-Funktionen (Kalender wechseln, erstellen, einladen) |
| `VITE_FEATURE_…`      | wie im Developer Guide  | Jede Zusatzfunktion hat einen Schalter, der Name folgt dem Feature: `chat` → `VITE_FEATURE_CHAT`, `mapLinks` → `VITE_FEATURE_MAP_LINKS`, `emailNotifications` → `VITE_FEATURE_EMAIL_NOTIFICATIONS`. Liste und Standardwerte stehen im Developer Guide unter „Features“. |
| `VITE_CONFIG_URL`     | –                       | Adresse einer Konfigurationsdatei (JSON oder YAML), z. B. `/calendar.config.yaml` aus dem Ordner `public`. Ist sie gesetzt, kommt die gesamte Konfiguration aus der Datei, die übrigen `VITE_`-Variablen werden von der App nicht mehr genutzt. Der Entwicklungs-Proxy richtet sich weiter nach `VITE_API_BASE_URL`. |
| `API_PROXY_TARGET`    | `http://localhost:3000` | Nur Entwicklung: Backend, an das `npm run dev` und `npm run preview` alle Aufrufe unter `VITE_API_BASE_URL` weiterleiten. Greift nur bei relativer API-Adresse. |

## Wichtig

- **Alles mit `VITE_` landet im ausgelieferten JavaScript und ist für jeden lesbar.** Dort niemals Geheimnisse wie API-Schlüssel, Passwörter oder Tokens eintragen. Geheimnisse gehören ausschließlich ins Backend.
- `API_PROXY_TARGET` hat kein `VITE_` und wird nur vom Vite-Server gelesen, nicht vom Browser.
- Werte werden beim Start von `npm run dev` bzw. `npm run build` geprüft. Ein ungültiger Wert, zum Beispiel `VITE_STORAGE_MODE=cloud`, bricht mit einer genauen Fehlermeldung ab. Nach einer Änderung an einer `.env`-Datei den Dev-Server neu starten.
- Variablen werden beim Build fest eingebaut. Für eine andere Umgebung muss neu gebaut werden.
- Die `.env` gilt nur für diese Website. Sie wird in `src/config/parseEnv.ts` gelesen und geprüft, `src/main.tsx` reicht die Werte als Props an `<Calendar>` weiter. Die Komponente selbst liest nie `import.meta.env`, sondern nur ihre Props. Neue Variablen dort und in `src/env.d.ts` ergänzen und in `.example.env` aufnehmen.

## API lokal anbinden

1. Backend lokal starten, zum Beispiel auf Port 3000
2. In `.env` setzen: `VITE_STORAGE_MODE=remote` und `API_PROXY_TARGET=http://localhost:3000`
3. `npm run dev` neu starten

Der Browser ruft dann `/api/...` auf derselben Adresse wie die App auf, Vite leitet an das Backend weiter. Dadurch sind in der Entwicklung keine CORS-Einstellungen nötig.

Zum Testen ohne echtes Backend gibt es im Nachbarordner `TestBE` ein Test-Backend mit allen `/auth`- und `/events`-Endpunkten (Start mit `npm install` und `npm run dev`, Port 3000). Dort auch `VITE_FEATURE_AUTH=true` setzen.

---

[← Zurück](04-publishing.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](06-api-client.md)
