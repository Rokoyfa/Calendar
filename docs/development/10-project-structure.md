# Projektstruktur

```
README.md                      Überblick (Englisch), Startseite auf npm und GitHub
DEVELOPER_GUIDE.md             Inhaltsverzeichnis des Developer Guide (Englisch), Kapitel in docs/guide/
DEVELOPMENT.md                 Inhaltsverzeichnis dieser Entwicklungs-Doku (Deutsch), Kapitel in docs/development/
docs/guide/                    Developer Guide: ein Kapitel je Datei (01-embedding.md …), im npm-Paket enthalten
docs/development/              Entwicklung im Detail: ein Kapitel je Datei (01-quick-start.md …)
CHANGELOG.md                   Änderungen je Version
LICENSE                        MIT
api/openapi.yaml               REST-Vertrag (OpenAPI 3.1) für restDataSource und eigene Backends
demo/embed.html                Demo-Gastgeberseite: zwei Widgets, störendes CSS (Dev-Server)
demo/local.html                Testseite für den lokalen Build (dist-lib/cdn), über einen statischen Server
demo/cdn.html                  Testseite für die veröffentlichte Version über jsDelivr
scripts/packageVersion.ts      Version aus package.json für den Build (VERSION)
scripts/collect-types.mjs      Öffentliche Typdefinitionen für das npm-Paket einsammeln
scripts/check-imports.mjs      Modulgrenzen prüfen (Teil von npm run lint, siehe „Schichten“)
vite.lib.config.ts             Library-Build (npm und Script-Datei)
tsconfig.lib.json              Typdefinitionen der Bibliothek erzeugen
src/
├─ data/                       Daten-Adapter: CalendarDataSource, localDataSource, restDataSource, tenantDataSource
│                              (setzen die Repositories der Features zu StorageRepositories zusammen)
├─ lib/                        Öffentliche Bibliothek
│  ├─ index.ts                 Öffentliche Exporte: Calendar, defineCalendarElement, Daten-Adapter, Typen
│  ├─ CalendarWidget.tsx       <Calendar>: Props → Konfiguration, IsolatedRoot + CalendarApp
│  ├─ CalendarApp.tsx          AuthProvider + Repositories aus dataSource.connect (je nach Sitzung) + Provider + Router je Instanz
│  ├─ IsolatedRoot.tsx         Shadow Root mit gebündelten Stilen, stellt die Wurzel per RootElementContext bereit
│  ├─ element.tsx              <calendar-widget> (Custom Element, Attribute → Props)
│  ├─ element-auto.ts          Einstieg der Script-Datei: registriert <calendar-widget>
│  ├─ options.ts               Optionen aus Props, Attributen und Konfigurationsdatei lesen und prüfen
│  ├─ configFile.ts            Konfigurationsdatei (JSON, JSONC, YAML) laden
│  ├─ tenantConfig.ts          Einstellungen des Tenant-Dienstes übernehmen
│  ├─ appearance.ts            Farben und Schrift des Gastgebers als CSS-Variablen
│  ├─ handle.ts                CalendarHandle für die Steuerung von außen
│  ├─ eventCallbacks.ts        onEventCreate/Update/Delete um das EventRepository legen
│  ├─ linkParam.ts             Startansicht aus dem URL-Parameter (calendarPath) lesen
│  ├─ version.ts               VERSION
│  └─ config.ts                CalendarProps
├─ i18n/                       Sprache und Region
│  ├─ messages/                en/ und de/ je Bereich, fr, es, it, nl, pl, pt je eine Datei; Englisch definiert den Typ, index.ts lädt nach und führt zusammen
│  ├─ I18nProvider.tsx         Wählt die Sprache (Nutzer > Gastgeber > Browser > en-US), setzt lang an der Wurzel
│  ├─ useI18n.ts               m, format, weekInfo, locale
│  ├─ format.ts                Datum, Uhrzeit, Wochentage und Listen je Locale (Intl)
│  ├─ weekInfo.ts              Erster Wochentag und Zählweise der Wochen
│  ├─ locale.ts                Unterstützte Sprachen, Auswahl und Rückfall
│  └─ errorMessage.ts          Fehler-Codes in Text übersetzen
├─ context/
│  ├─ HostContext.ts           Vorgaben des Gastgebers: features, views, theme, initialView, timeZone
│  ├─ HostBridge.ts            Verbindung zum CalendarHandle (Zustand melden, Befehle annehmen)
│  ├─ hostLink.ts              Link auf einen Pfad des Widgets über die Gastgeberseite (öffentliche Links, Buchungsseiten)
│  ├─ TimeZoneContext.ts       Anzeige-Zeitzone: Einstellung, sonst Host, sonst System
│  └─ RootElementContext.ts    Wurzel-Element des Widgets (Theme, Modals, Tasten, Breakpoints)
├─ router.tsx                  Routen und createCalendarRouter (memory oder browser): /, /settings, /calendars/new, /login, …
├─ pages/
│  ├─ CalendarPage.tsx         Kalender mit Startansicht, Kontomenü (ohne Anmeldefunktion Einstellungen im Kalendermenü), Bestätigungsleiste und Übernahme-Abfrage
│  ├─ calendar/                Hooks der Kalenderseite: Menü, Link-Parameter, Rechte für Termine, Aufgaben-Einrichtung
│  ├─ RespondPage.tsx          Antwort aus dem Link einer Einladungs-E-Mail speichern und ändern (ohne Anmeldung)
│  ├─ BookingPage.tsx          Öffentliche Buchungsseite /book/:token: freie Zeiten, Name, E-Mail, Notiz (ohne Anmeldung)
│  ├─ BookingLinkPage.tsx      Buchung aus den E-Mail-Links bestätigen und absagen (ohne Anmeldung)
│  ├─ SharedCalendarPage.tsx   Öffentlicher Link auf einen Kalender (nur lesen)
│  └─ SettingsPage.tsx         Einstellungen in Tabs: Kalender, Verbindungen, Einladungen, Darstellung, Planung, Benachrichtigungen, Konto, Sicherheit, Daten
├─ main.tsx                    Einstieg der Website: <Calendar routing="browser" /> mit Werten aus der .env
├─ env.d.ts                    Typen der Umgebungsvariablen
├─ config/
│  ├─ defaults.ts              CalendarConfig, Standardwerte und erlaubte Werte (auch für vite.config.ts, von lib/ weitergegeben)
│  ├─ parseEnv.ts              Umgebungsvariablen lesen und prüfen (auch in vite.config.ts)
│  ├─ env.ts                   Geprüfte .env-Werte für die Website (nur main.tsx)
│  ├─ calendars.ts             ID des persönlichen Kalenders
│  └─ routes.ts                Pfade, Token-Parameter und sichere Weiterleitung nach dem Login
├─ assets/
│  ├─ css/                     Styles, gebündelt über index.css (je Bereich eine Datei, z. B. calendars.css)
│  └─ imgs/
├─ components/                 Featureübergreifende Bausteine
│  ├─ Button.tsx               Button und ButtonLink mit Varianten (primary, secondary, outline, danger, success),
│  │                           volle Breite und Ladezustand (pendingLabel)
│  ├─ Form.tsx                 Formular mit einheitlichem Aufbau (noValidate, formSection)
│  ├─ Modal.tsx                Fenster (<dialog>), per Portal direkt in <body>
│  ├─ FormField.tsx            Beschriftung + Feld + Fehlermeldung (label oder fieldset)
│  ├─ SelectField.tsx          Auswahlfeld aus Optionsliste
│  ├─ NumberField.tsx          Ganzzahl mit Einheit
│  ├─ DateTimeField.tsx        Datum + Uhrzeit in einer Zeile
│  ├─ ChoiceChip.tsx           Runder Auswahl-Chip (Radio oder Checkbox)
│  ├─ IconButton.tsx           Symbol-Schaltfläche
│  ├─ SegmentedControl.tsx     Umschalter mit mehreren Optionen
│  ├─ SegmentedField.tsx       Umschalter mit Beschriftung als Formularfeld
│  ├─ Tabs.tsx                 Tabs mit Inhalt (role=tablist/tabpanel, Pfeiltasten)
│  ├─ Switch.tsx               Ein/Aus-Schalter (Checkbox mit role=switch)
│  ├─ Stepper.tsx              Fortschritt in Schritten, erledigte Schritte anklickbar
│  ├─ TextField.tsx            Textfeld mit Beschriftung und Fehler, UrlField mit den Vorgaben für Adressen
│  ├─ PasswordField.tsx        Passwortfeld mit „Anzeigen“
│  ├─ StatusMessage.tsx        Fehler- (role="alert") und Erfolgsmeldung (role="status"), ActionFeedback für beides
│  ├─ PageLayout.tsx           Eigene Seite mit „Zum Kalender“ und Titel, als Karte (Anmeldung) oder volle Breite (Einstellungen)
│  ├─ PageSection.tsx          Abschnitt mit Überschrift und Erklärung links, Inhalt rechts, optional als Gefahrenbereich
│  ├─ ConfirmModal.tsx         Bestätigung einer gefährlichen Aktion, schließt sich nach Erfolg selbst
│  ├─ FormActions.tsx          Abbrechen und Absenden am Formularende, Standard „Speichern“
│  ├─ AsyncSwitch.tsx          Schalter, der eine asynchrone Aktion auslöst, mit Sperre und Fehlermeldung
│  ├─ CopyButton.tsx           In die Zwischenablage kopieren, zeigt „Kopiert“ bis sich der Wert ändert
│  ├─ ItemList.tsx             Liste oder Leer-Hinweis
│  ├─ LimitedAdd.tsx           Formular zum Hinzufügen oder Hinweis „Höchstzahl erreicht“
│  ├─ ManagedListSection.tsx   Abschnitt mit Liste, Hinzufügen bis zur Höchstzahl und Entfernen mit Bestätigung
│  └─ Icons.tsx                SVG-Symbole
├─ hooks/                      Featureübergreifende Hooks
│  ├─ useKeyboardShortcuts.ts  Tastenkürzel des Kalenders (Tasten in Calendar.tsx)
│  ├─ useAsyncAction.ts        Asynchrone Aktion mit Ladezustand, Erfolg und Fehlermeldung
│  ├─ useAsyncResource.ts      Daten laden, neu laden, Abbruch bei Wechsel, apply() übernimmt das Ergebnis einer Änderung
│  ├─ useForm.ts               Ganzes Formular: Werte, Prüfung, Vorbereiten, Absenden mit Lade-, Erfolgs- und Fehlerzustand
│  ├─ useFormState.ts          Formularwerte, Fehler je Feld, `bind(name)` für value/error/onChange, Prüfung beim Absenden, Zurücksetzen
│  ├─ useConfirm.ts            Ziel einer Bestätigung merken (ask/close), passend zu ConfirmModal
│  ├─ useActionError.ts        Fehler einer Aktion als Meldung, attempt(action) leert und setzt ihn
│  ├─ useLocationUrl.ts        Kartenlink zu einem Ort
│  └─ useRequiredContext.ts    Context lesen und Fehler werfen, wenn der Provider fehlt
├─ domain/                     Fachliches Modell ohne React und ohne Features, von allen Features genutzt
│  ├─ event.ts                 Termin-Typen, Farben, Validierung, Vorkommen eines Termins
│  ├─ recurrence.ts            Wiederholungsregeln, Berechnung der Vorkommen
│  ├─ rrule.ts                 RRULE lesen und schreiben
│  ├─ ical.ts                  iCalendar (.ics) schreiben und lesen, vtimezone.ts die Zeitzonen dazu
│  ├─ category.ts              Kategorien und Kategorie-Filter
│  ├─ eventChange.ts           Änderungen eines Termins für Verlauf und Benachrichtigungen
│  ├─ overlap.ts               Überschneidungen mit anderen Terminen
│  ├─ calendarView.ts          Ansichten Tag, Woche, Monat, Jahr, Agenda, Aufgaben
│  ├─ holidays.ts              Feiertags-Region auflösen (Einstellung, Host, Sprache), Antworten des Backends prüfen
│  ├─ location.ts              Ort eines Termins als Kartenlink
│  └─ preferences.ts           Einstellungen: Typen, Standardwerte, Prüfung, Startansicht
├─ utils/                      Allgemeine Hilfen ohne Fachwissen
│  ├─ api.ts                   API-Client (fetch mit JSON, Query, Token, Timeout, Abbruch)
│  ├─ apiError.ts, appError.ts Fehler des API-Clients und der App mit Fehler-Codes
│  ├─ classNames.ts            CSS-Klassen zusammensetzen
│  ├─ dom.ts, popover.ts       Klick-Handler ohne Weitergabe, Position von Popovers
│  ├─ color.ts                 Hex-Farben, lesbare Schriftfarbe
│  ├─ date.ts, timeZone.ts     Datums- und Zeitfunktionen, Zeitzonen
│  ├─ timestamp.ts             Zeitstempel prüfen
│  ├─ number.ts                Ganzzahl-Prüfung mit Bereich
│  ├─ object.ts                Felder übernehmen, Wert aus fester Liste prüfen (isOneOf)
│  ├─ parse.ts                 Antworten prüfen: isRecord/asRecord, textOrEmpty/textOrNull/filledTextOrNull, parseList, requireValue
│  ├─ list.ts                  Listen per id ändern (replaceById, upsertById, removeById), compact für bedingte Einträge
│  ├─ download.ts              Datei im Browser speichern (saveBlob)
│  ├─ localStorageValue.ts     Ein Wert im localStorage, localStorageList.ts eine Liste
│  ├─ liveSocket.ts            WebSocket für Live-Änderungen mit Wiederverbindung
│  ├─ logoutHooks.ts           Aufräumen beim Abmelden
│  └─ validation.ts            Fehler je Feld, gemeinsame Prüfung „gibt es Fehler?“, E-Mail prüfen
└─ features/
   ├─ calendar/                Anzeige: Tag, Woche, Monat, Jahr
   │  │                        constants/views.ts beschreibt jede Ansicht einmal (Zeitraum, Schritt, Titel),
   │  │                        hooks/useCalendarView.ts steuert Ansicht und Datum
   │  │                        hooks/useEventEditor.ts den Termindialog (neu, bearbeiten, per Link geöffnet, fremde Änderungen),
   │  │                        hooks/useUndo.ts das Rückgängig-Angebot, utils/editorAccess.ts was im Dialog erlaubt ist
   │  ├─ components/
   │  ├─ constants/
   │  ├─ hooks/
   │  ├─ types/
   │  └─ utils/                Aufteilung mehrtägiger Termine, sichtbare Höhe, überlappende Termine,
   │                           gemeinsame Attribute von Terminblock und Termin-Chip
   │                           (components/MiniMonth: kleiner Monat für Jahresansicht und Kalender-Vorschau)
   ├─ events/                  Termine anlegen, bearbeiten, löschen
   │  ├─ components/           EventModal, DeleteEventModal, ColorPicker, RecurrenceFields, RecurrenceScopeModal, ScopeButtons, CustomColorSettings,
   │  │                        TimeZoneField, ReminderField, AttendeesField, LinksField
   │  ├─ constants/            Farben, Bezeichnungen der Bearbeitungsbereiche
   │  ├─ hooks/                useEvents, useCustomColors
   │  ├─ types/
   │  └─ utils/                Serien-Aktionen gegen das Repository, Auswahl der Bereiche, iCalendar-Import (icalExchange)
   ├─ reminders/               Erinnerungen planen und anzeigen, solange das Widget offen ist (hooks/useReminders, components/ReminderNotices,
   │                           utils/reminders: fällige Erinnerungen, utils/browserNotifications: Erlaubnis für Browser-Benachrichtigungen)
   ├─ attachments/             Anhänge: Repository, AttachmentsField, Typen und Prüfung
   ├─ bookings/                Buchungsseiten: Repository, BookingPagesSection, BookingPageForm, Wochenzeiten und freie Zeiten (utils/booking)
   ├─ caldav/                  CalDAV: Server-Konten und App-Passwörter, CaldavProvider, CaldavEventRepository (Termine fremder Server)
   ├─ external/                Abonnierte Kalender (iCal-URL): Repository, Einstellungen, Termine als schreibgeschützte Quelle
   ├─ notifications/           Benachrichtigungen im Kalender: Repository, NotificationBell
   ├─ peers/                   Persönlichen Kalender teilen: Freigaben, Anfragen, PeerEventRepository, SharingSection
   ├─ categories/              Kategorien: CategoryField (Termin-Dialog), CategoryFilterModal, CategoriesSection (Einstellungen), useCategories
   ├─ chat/                    Chat zu Terminen: ChatPanel, ChatProvider (Ungelesen-Zähler), UnreadBadge, useChatMessages
   ├─ freebusy/                Gemeinsame Zeit finden: Repository, Slot-Suche, FindTimeModal, FreeBusySettings
   ├─ push/                    Push: Repository, Geräte-Abonnement, PushSettings, PushSync
   ├─ pwa/                     Installieren als App: installPrompt, AppInstallSettings
   ├─ tasks/                   Aufgaben: Typen, Repositories (lokal und REST), TasksProvider, TaskModal, TasksView, DayTasks, Planer (taskPlanner, workingTimeLaw, TaskPlanModal, TaskPlanningSettings)
   ├─ holidays/                Feiertage: useHolidays (Region auflösen, Quelle wählen), HolidaySettings, Bibliothek date-holidays (lazy)
   ├─ storage/                 Datenspeicherung
   │  ├─ components/           LocalImportPrompt: lokale Termine ins Konto übernehmen
   │  ├─ context/              StorageContext, StorageProvider (inkl. version/invalidate zum Neuladen)
   │  ├─ hooks/                useStorage, useColorRepository, usePreferencesRepository
   │  ├─ types/                storage.ts: alle Repository-Schnittstellen (Vertrag der Daten-Adapter)
   │  └─ utils/                copyEvents (Termine samt Serien-Verknüpfung kopieren)
   ├─ calendars/               Kalenderauswahl (persönlich und Teams), vorbereitet für den Team-Modus
   │  ├─ components/           CalendarSwitcher (Button und Fenster), ActiveCalendarIndicator (Plakette im Kopf),
   │  │                        CalendarPreview (Monatsvorschau), InvitationList (offene Einladungen),
   │  │  ├─ settings/          CalendarSettingsPage mit Allgemein, Mitglieder, Einladungen, Import & Export (mit Abo-Link), Gefahrenbereich
   │  │                        CalendarSettings (Liste in den Einstellungen, Verlassen)
   │  │  └─ create/            CreateCalendarPage mit den Schritten Details, Farbe, Mitglieder, Überprüfen
   │  ├─ constants/            Persönlicher Kalender, Rangfolge der Rollen (Bezeichnungen in i18n)
   │  ├─ context/              CalendarsProvider (lädt Kalender und Einladungen, aktiver Kalender, verlassen), liegt in App.tsx
   │  ├─ repositories/         LocalCalendarRepository (nur „Persönlich“), RemoteCalendarRepository (API)
   │  ├─ hooks/                useCalendars, useTeam (Mitglieder und Einladungen eines Teams)
   │  ├─ types/
   │  └─ utils/                Regeln: persönlich oder Team (`kind`), wer verlassen darf, welche Kalender gerade sichtbar sind
   │                           (`visibleCalendarIds`: im persönlichen Kalender dieser plus alle Teams mit showInPersonal)
   ├─ preferences/             Einstellungen (Farbschema, Startansicht)
   │  ├─ components/           PreferencesSettings, NotificationSettings (E-Mails zu Terminen)
   │  ├─ context/              PreferencesProvider (lädt, speichert, setzt data-theme)
   │  └─ hooks/                usePreferences
   └─ authorization/           Anmeldung, Registrierung, Abmeldung, Konto, Passwort, E-Mail
      ├─ components/           LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage,
      │                        AccountMenu, AuthGate, AuthFields, ContinueLink, ResendVerificationButton,
      │                        EmailVerificationBanner
      │  └─ account/           AccountSettings mit Profil, E-Mail, Passwort, Konto löschen
      ├─ context/              AuthContext, AuthProvider (Sitzung und alle Konto-Aktionen)
      ├─ hooks/                useAuth
      ├─ repositories/         RemoteAuthRepository (/auth-Endpunkte)
      ├─ types/
      └─ utils/                Prüfung der Formulare, Datenexport
```

## Schichten

Jede Schicht darf nur „nach unten“ importieren. `npm run lint` prüft das mit `scripts/check-imports.mjs` (auch einzeln: `npm run lint:imports`):

| Schicht | darf nicht importieren |
| --- | --- |
| `utils/` | `domain`, `context`, `components`, `features`, `data`, `pages`, `lib` |
| `domain/` | `context`, `components`, `features`, `data`, `pages`, `lib` |
| `components/`, `hooks/` | `features`, `data`, `pages`, `lib` |
| `features/` | `pages`, `lib` |
| `data/` | `pages`, `lib` |

Zwischen Features gilt zusätzlich: Ein Feature importiert ein anderes nur über dessen `index.ts`. Was ein anderes Feature braucht, wird dort exportiert (Typen mit `export type`). Komponenten, die erst bei Bedarf geladen werden, exportiert das Feature selbst als Lazy-Komponente (z. B. `LazyEventModal`).

## Regeln

- Jedes Feature ist nach `components`, `hooks`, `repositories`, `types`, `utils`, `constants` usw. aufgeteilt. Repositories liegen bei ihrem Feature, ihre Schnittstellen zentral in `features/storage/types/storage.ts`.
- Fachliche Typen und Regeln, die mehrere Features brauchen (Termin, Wiederholung, Kategorie, Einstellungen …), liegen in `domain/`. Allgemeine Hilfen ohne Fachwissen in `utils/`. Props-Typen bleiben bei ihrer Komponente.
- `calendar` zeigt nur an und kennt die Speicherung nicht. `events` enthält die Termin-Logik, `storage` den Zugang zu den Repositories.
- Große Komponenten werden in Hooks (Zustand und Aktionen) und Teil-Komponenten (Formularbereiche) zerlegt, z. B. `Calendar` mit `useCalendarOccurrences`, `useEventActions`, `usePlanPreview`, `useCalendarController` und `CalendarEventEditor`, `EventModal` mit `useEventForm`, `EventGeneralFields` und `EventDetailsFields`.
- Schaltflächen immer über `Button`/`ButtonLink`, Formulare über `useForm` + `Form`, Meldungen über `ActionFeedback`. Keine eigenen `button`-Klassen oder Lade-Texte von Hand.
- Context-Hooks nutzen `useRequiredContext`.
- Keine Doppelungen: Was an mehr als einer Stelle gebraucht wird, liegt einmal in `components/`, `hooks/`, `domain/` oder `utils/` bzw. im `utils/`-Ordner des Features. Formularfelder werden aus `FormField` und den darauf aufbauenden Feldern zusammengesetzt, Formularenden aus `FormActions`, Listen mit Leer-Hinweis aus `ItemList`, Antworten des Backends mit den Hilfen aus `utils/parse.ts` geprüft, Datumswerte nur über `utils/date.ts` geprüft und berechnet, Backend-Aufrufe nur über den API-Client aus `utils/api.ts`.
- Farben für Hell- und Dunkelmodus stehen nur einmal in `variables.css` und nutzen `light-dark()`. Terminfarben werden ausschließlich über `--event-color` und `--event-text` gesetzt, egal ob Standard- oder eigene Farbe.

---

[← Zurück](09-data-storage.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](11-known-limitations.md)
