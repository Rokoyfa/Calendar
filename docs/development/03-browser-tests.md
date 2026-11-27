# Browser-Tests

Die Browser-Tests in `e2e/` spielen die wichtigsten Abläufe in Chromium durch: Anmelden und lokaler Modus, Termin anlegen, ändern, löschen und rückgängig machen, einzelnen Termin einer Serie ändern, Live-Updates und Konfliktschutz mit zwei Nutzern, Anhänge, Papierkorb, Datenexport und Tastaturbedienung.

`e2e/features.spec.ts` prüft die Feature-Schalter: Für jeden Schalter mit sichtbarer Oberfläche steht in `PROBES`, woran man ihn erkennt (Menüeintrag, Tab, Feld, Überschrift). Die Tests öffnen dafür die Seite `e2e/harness/features.html`, die das Widget mit den Schaltern aus der URL startet (`?features=auth,search` schaltet nur diese beiden ein, `?features=all` alle, `&path=/settings` öffnet eine Seite). Pro Schalter wird geprüft, dass er allein seine Bedienelemente zeigt und dass sie ohne ihn fehlen; außerdem, dass Termine mit allen Zusatzfunktionen aus weiter angelegt werden können. Neue Schalter mit eigener Oberfläche bekommen dort einen Eintrag.

**Einmalig:**

```bash
npm install
npx playwright install chromium
cd ../TestBE && npm install
```

**Starten:** `npm run test:e2e`. Playwright startet dafür selbst ein TestBE (Port 3998) und den Entwicklungsserver (Port 5198), jeweils mit eigenen, leeren Daten in einem temporären Ordner. Laufende Server auf 3999 und 5173 stören nicht, `data.json` des TestBE bleibt unberührt.

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `E2E_BACKEND_DIR` | `../TestBE` | Ordner des TestBE |
| `E2E_API_PORT` / `E2E_APP_PORT` | `3998` / `5198` | Ports der beiden Server |
| `E2E_DEBUG` | – | Zeigt auch die Ausgaben des Entwicklungsservers |

**Mit einem eigenen Backend:** `E2E_BACKEND_DIR` auf dessen Ordner setzen. Playwright startet dort `npx tsx src/server.ts`; wird das Backend anders gestartet, den Befehl unter `webServer` in `playwright.config.ts` anpassen. Das Backend muss `PORT`, `APP_URL`, `DATA_FILE` und `ATTACHMENTS_DIR` aus der Umgebung lesen. Außerdem lesen die Tests die Bestätigungs-E-Mails über `GET /api/dev/mails` aus. Diesen Endpunkt gibt es nur im TestBE, er gehört nicht zur API in `api/openapi.yaml`. Ein eigenes Backend braucht für die Tests also einen solchen Entwicklungs-Endpunkt (Antwort: Liste von `{ to, subject, link }`) oder muss neue Konten in der Testumgebung direkt als bestätigt anlegen.

Schlägt ein Test fehl, liegt unter `test-results/` ein Trace, den `npx playwright show-trace <Datei>` Schritt für Schritt abspielt. Jeder Test legt eigene Nutzer mit zufälliger E-Mail an, die Tests laufen deshalb unabhängig voneinander und parallel.

---

[← Zurück](02-embedding.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](04-publishing.md)
