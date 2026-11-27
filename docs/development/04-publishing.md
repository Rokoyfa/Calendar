# Veröffentlichen

Das Paket heißt **`@rokoyfa/calendar`** und erscheint öffentlich auf npm unter MIT-Lizenz. Über npm ist die Script-Datei automatisch auch per CDN erreichbar.

**Einmalig:** ein npm-Konto mit dem Namen `rokoyfa` anlegen (oder eine Organisation `rokoyfa`, dann darf der Scope mehreren gehören) und auf dem Rechner `npm login` ausführen.

**Vor dem Veröffentlichen lokal testen:**

```bash
npm run build:lib
npm pack                       # erzeugt rokoyfa-calendar-2.2.0.tgz
```

- In einem anderen Projekt: `npm install ../Calendar/rokoyfa-calendar-2.2.0.tgz`, dann `import { Calendar } from '@rokoyfa/calendar'`.
- Ohne npm: `demo/local.html` über einen beliebigen statischen Server öffnen (z. B. `npx serve .` im Projektordner), sie lädt `dist-lib/cdn/calendar-widget.js`.

**Veröffentlichen:**

1. Version mit `npm version patch|minor|major --no-git-tag-version` erhöhen und `CHANGELOG.md` ergänzen. Ab 1.0 gilt SemVer streng: `1.0.1` für Korrekturen, `1.1.0` für Neues, das bestehende Einbindungen nicht bricht, `2.0.0` für alles, was Props, Attribute, DOM-Events, exportierte Typen, den Daten-Adapter oder den REST-Vertrag inkompatibel ändert.
2. `npm publish`. Vorher laufen automatisch Lint, Typprüfung, Tests und `build:lib`. `publishConfig.access` ist `public`, nötig für gescopete Pakete.
3. Commit taggen, z. B. `git tag v2.2.0 && git push --tags`.

**Danach erreichbar** (CDN nach wenigen Minuten):

| Weg | Adresse |
| --- | --- |
| npm | `npm install @rokoyfa/calendar` |
| jsDelivr | `https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@2/dist-lib/cdn/calendar-widget.js` |
| unpkg | `https://unpkg.com/@rokoyfa/calendar@2/dist-lib/cdn/calendar-widget.js` |

`demo/cdn.html` bindet die veröffentlichte Version über jsDelivr ein und zeigt alle Einbindungsarten (lokal, mit Backend, Ereignisse, Theme). `@2` holt immer die neueste `2.x`, für feste Stände die volle Version angeben (z. B. `@2.2.0`).

**Im Paket** stehen nur `dist-lib/` (npm-Build mit Typen, CDN-Script, Source-Maps), `api/openapi.yaml`, `schema/`, die beiden Beispiel-Konfigurationen aus `demo/`, `DEVELOPER_GUIDE.md`, `CHANGELOG.md`, `README.md`, `LICENSE` und `package.json`. Die Version steht zur Laufzeit in `VERSION` (Export) bzw. `customElements.get('calendar-widget').version`.

---

[← Zurück](03-browser-tests.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](05-configuration-env.md)
