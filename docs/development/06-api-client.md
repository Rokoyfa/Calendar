# API-Client

Alle Aufrufe an das Backend laufen über einen gemeinsamen Client aus `src/utils/api.ts`. Direktes `fetch` wird im übrigen Code nicht verwendet.

## Verwendung

Instanzen entstehen je Widget aus den Props (Adresse und Timeout), nie als globale Instanz, weil mehrere Widgets auf einer Seite verschiedene APIs nutzen können:

```ts
import { createApiClient, encodePathSegment } from '../../../utils/api.ts'

const apiClient = createApiClient({ baseUrl: config.apiBaseUrl, timeoutMs: config.apiTimeoutMs })

const teams = await apiClient.get<Team[]>('/teams', { query: { page: 1, tags: ['a', 'b'] } })
const team = await apiClient.post<Team>('/teams', { name: 'Familie' })
await apiClient.put<Team>(`/teams/${encodePathSegment(id)}`, changes)
await apiClient.patch<Team>(`/teams/${encodePathSegment(id)}`, { name: 'Neu' })
await apiClient.delete(`/teams/${encodePathSegment(id)}`)
```

Weitere Optionen: `createApiClient({ baseUrl, timeoutMs, getAccessToken, onUnauthorized, headers, credentials })`, so macht es auch `RemoteEventRepository`.

## Was der Client übernimmt

- **JSON:** Objekte werden als JSON gesendet, Antworten mit JSON-Content-Type automatisch gelesen. `FormData`, `Blob`, `URLSearchParams` und Strings gehen unverändert raus, zum Beispiel für Datei-Uploads.
- **Query-Parameter:** `query: { a: 1, b: ['x', 'y'] }` wird zu `?a=1&b=x&b=y`, `null` und `undefined` werden weggelassen.
- **Leere Antworten:** `204 No Content` und leere Antworten ergeben `undefined`.
- **Token:** Liefert `getAccessToken` einen Wert, wird `Authorization: Bearer …` gesetzt. Vorbereitet für die Anmeldung.
- **Timeout:** Standard aus `VITE_API_TIMEOUT_MS`, pro Anfrage über `timeoutMs` änderbar.
- **Abbruch:** Ein eigenes `signal` (z. B. `AbortController`) wird zusammen mit dem Timeout berücksichtigt.
- **401:** Ruft `onUnauthorized` auf, gedacht zum Abmelden, wenn der Token abgelaufen ist.

## Fehler

Jeder Fehler ist ein `ApiError` (aus `src/utils/apiError.ts`). Angezeigt wird er über `getErrorMessage(error, m)` in der Sprache des Nutzers: bekannte Fälle über `code` (z. B. `invalidCredentials`, `emailTaken`), sonst die `message` des Servers, sonst eine Standardmeldung je Status oder Art.

| `kind`    | `status` | Meldung |
| --------- | -------- | ------- |
| `http`    | 4xx/5xx  | `message` aus der Server-Antwort, sonst eine Standardmeldung je Status, z. B. 401 „Please sign in.“ / „Bitte melde dich an.“ |
| `timeout` | `null`   | Zeitlimit überschritten |
| `network` | `null`   | Server nicht erreichbar |
| `aborted` | `null`   | Anfrage abgebrochen |
| `parse`   | `null`   | Antwort nicht lesbar |

Zusätzlich gibt es `error.isUnauthorized`, `error.isNotFound`, `error.isServerError` und `error.body` mit der vollständigen Server-Antwort. Prüfen mit `isApiError(error)`.

Fehlermeldungen vom Backend sollten als JSON in der Form `{ "message": "…" }` kommen, dann werden sie direkt angezeigt.

> Der Typ in `get<T>()` ist eine Zusicherung, keine Prüfung zur Laufzeit. Antwortet das Backend mit einer anderen Struktur, fällt das erst bei der Verwendung auf.

---

[← Zurück](05-configuration-env.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](07-sign-in.md)
