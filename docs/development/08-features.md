# Funktionen

## Ansichten

Umschaltbar über **Tag / Woche / Monat / Jahr / Agenda / Aufgaben** in der Kopfzeile. Pfeile und **Heute** springen immer um die Einheit der aktuellen Ansicht; in der Aufgabenansicht gibt es sie nicht (`isFixed` in `VIEW_DEFINITIONS`).

- **Tag:** ein Tag im Zeitraster von 00:00 bis 23:00 Uhr, Titel z. B. „Samstag, 31. Oktober 2026“
- **Woche:** Montag bis Sonntag im Zeitraster, Titel mit Monat(en) und Kalenderwoche. Ein Klick auf einen Tageskopf öffnet diesen Tag.
- **Monat:** Monatsraster mit bis zu drei Terminen pro Tag, darüber hinaus „+N weitere“. Ein Klick auf die Tageszahl oder „weitere“ öffnet den Tag, ein Klick auf eine freie Stelle legt dort einen Termin um 09:00 an.
- **Jahr:** alle zwölf Monate als kleine Raster, Tage mit Terminen haben einen Punkt. Ein Klick auf einen Tag öffnet die Tagesansicht, ein Klick auf den Monatsnamen die Monatsansicht.
- Heutiger Tag ist hervorgehoben. Eine **Linie zeigt die aktuelle Uhrzeit** über alle Tage der Tages- und Wochenansicht, in der Spalte von heute kräftig rot mit Punkt. Sie erscheint nur, wenn heute im sichtbaren Zeitraum liegt, und rückt jede Minute weiter.
- Mehrtägige und wiederkehrende Termine erscheinen in allen Ansichten
- **Aufgaben:** alle Aufgaben der angezeigten Kalender nach Status, als Liste untereinander oder als Board nebeneinander, mit **Erstellen** oben rechts

## Handy

- Kopfzeile zweizeilig: Navigation und **+** oben, darunter Titel und Ansichtsumschalter über die volle Breite
- Woche: alle sieben Tage passen ohne seitliches Scrollen auf den Bildschirm. Dafür kompakte Tagesköpfe („Mo 26“), nur Stundenzahlen in der Zeitspalte und kleinere Termine mit Silbentrennung. Ein Tipp auf den Tageskopf öffnet den Tag.
- Monat: statt Terminleisten eine Zahl mit der Anzahl der Termine je Tag
- Jahr: Monate zweispaltig
- Startansicht ist auf dem Handy standardmäßig **Tag**, auf größeren Bildschirmen **Woche**. Beides lässt sich in den Einstellungen ändern. Als Handy gilt eine Breite bis 700 px.

## Termine

- Anlegen per Klick auf eine Stunde im Raster oder über den **+**-Button im Header. Klick, Ziehen oder Enter im Raster (auch Monat und Ganztägig) öffnen **Schnell anlegen** (`QuickCreate` in einem `AnchoredPopover` an der Klickstelle, Position aus `usePointerAnchor`): Titel tippen, Enter speichert im Zielkalender, **Weitere Optionen** öffnet den vollen Dialog mit dem bisher Eingegebenen. Solange die Blase offen ist, zeigt das Raster den Entwurf gestrichelt (`toDraftEvent`, `isDraftEvent`, über `useCalendarOccurrences`). Für Anfragen an geteilte Kalender öffnet sich gleich der volle Dialog. Der **+**-Button und `N` öffnen immer den vollen Dialog.
- Ein Klick (oder Enter) auf einen Termin öffnet die **Vorschau** (`EventPeek`, Rechte über `CalendarEventPeek` wie im Dialog): Zeit, Wiederholung, Ort mit Kartenlink, Links, Quelle, Teilnehmende und eigene Antwort, Beschreibung (gekürzt). Aktionen: **Löschen** und **Duplizieren** (wenn erlaubt) sowie **Bearbeiten** bzw. **Details**, das den vollen Dialog öffnet.
- **Zu Datum springen:** Der Titel im Header ist ein Button (`DateJump`), der einen Monatskalender öffnet (Monate blättern, **Heute**), der sichtbare Zeitraum ist markiert.
- **Wischen** (`useSwipeNavigation`): auf Touch-Geräten wechselt ein waagerechtes Wischen über den Kalender zum nächsten oder vorherigen Zeitraum, nicht in festen Ansichten, nicht während der Planvorschau und nicht, solange der Bereich selbst noch waagerecht scrollen kann.
- Löschen mit Sicherheitsabfrage (Ja / Nein)
- Felder: Titel, Startdatum, Beginn, Enddatum, Ende, Beschreibung, Farbe
- **Mehrtägige Termine:** Ein Termin kann über Mitternacht oder mehrere Tage gehen. Wird das Startdatum geändert, verschiebt sich das Enddatum um dieselbe Anzahl Tage.
- Eingaben werden geprüft, zum Beispiel Pflichttitel, Enddatum nicht vor Startdatum und Ende nach Beginn
- Ein Klick auf 23:00 legt einen Termin bis 00:00 des Folgetags an
- **Gleichzeitiges Bearbeiten:** Jeder Termin hat eine `version`, die bei jeder Änderung steigt. Beim Speichern und Löschen schickt der Kalender die Version mit, die beim Öffnen des Dialogs galt (`If-Match`). Hat inzwischen jemand anderes den Termin geändert, antwortet der Server mit `412` und `eventChanged`. Der Dialog zeigt dann „Trotzdem speichern“ (ohne Prüfung) und „Verwerfen und neu laden“. Auch Rückgängig überschreibt keine fremden Änderungen. Lokal prüft `LocalEventRepository` dasselbe.
- **Live-Updates:** Ändert jemand einen Termin in einem angezeigten Kalender, schickt der Server `event.changed` über den WebSocket. `useLiveEvents` lädt dann die Termine neu (mehrere Meldungen kurz hintereinander nur einmal) und nach einem Verbindungsabbruch einmal zum Nachholen. Ist der geänderte oder gelöschte Termin gerade im Dialog offen, zeigt der Dialog einen Hinweis mit „Neu laden“. Eigene Änderungen (`changedBy` = eigene ID) lösen keinen Hinweis aus. Im lokalen Modus hört `LocalEventRepository` auf das `storage`-Ereignis anderer Tabs. Schalter: `liveUpdates`.
- **Papierkorb:** Löschen verschiebt Termine in den Papierkorb ihres Kalenders (`DELETE /events/:id`, lokal unter `calendar.events.v1.trash`). In den Kalender-Einstellungen gibt es dafür den Tab „Papierkorb“ (Team und persönlich) mit „Wiederherstellen“ und „Endgültig löschen“. Die Liste zeigt 20 Einträge, mehr über „Weitere anzeigen“, ab 8 Einträgen gibt es eine Suche (Titel, Ort, wer gelöscht hat). Die Einstellungen des persönlichen Kalenders haben dafür jetzt auch Tabs: Allgemein, Import & Export, Papierkorb. „Papierkorb leeren“ löscht nach einer Rückfrage alle Einträge, die man löschen darf (`DELETE /calendars/:id/trash`). „Wiederherstellen“ ist in der Akzentfarbe umrandet, „Endgültig löschen“ und „Papierkorb leeren“ rot (`button--dangerOutline`). Nach 30 Tagen ist ein Termin endgültig weg. Rückgängig nach dem Löschen nutzt `restore`, dadurch bleiben ID, Anhänge und Chat erhalten. Eine herausgelöste Ausnahme lässt sich nur wiederherstellen, solange ihre Serie existiert (`seriesDeleted`). Code: `TrashSection.tsx`, `features/events/utils/trash.ts`. Schalter: `trash`.

## Wiederkehrende Termine

- Wiederholung **täglich, wöchentlich, monatlich oder jährlich**, jeweils mit Intervall, zum Beispiel alle 2 Wochen
- Wöchentlich: beliebige Wochentage auswählbar, zum Beispiel Montag und Mittwoch. Wird das Startdatum geändert und ist nur dessen Wochentag gewählt, wandert der Wochentag mit.
- Monatlich, abgeleitet vom Startdatum, wahlweise:
  - **am selben Tag**, zum Beispiel „am 15.“. Monate ohne diesen Tag werden übersprungen (31. → nur Monate mit 31 Tagen).
  - **am n-ten Wochentag**, zum Beispiel „am zweiten Dienstag“. Beim fünften Wochentag werden Monate ohne fünften übersprungen.
  - **am letzten Wochentag**, zum Beispiel „am letzten Freitag“. Wird nur angeboten, wenn das Startdatum in der letzten Woche des Monats liegt.
- Jährlich am selben Datum, der 29. Februar nur in Schaltjahren
- **Regeln aus anderen Programmen** (Import, CalDAV), die sich so nicht beschreiben lassen, etwa „letzter Werktag im Monat“ (`BYSETPOS`), „am 1. und 15.“ oder „jedes Jahr am 4. Donnerstag im November“: `recurrence.rule` hält die RRULE ohne `UNTIL`/`COUNT` (das Ende steht in `until`/`count`), `domain/rrule.ts` berechnet die Vorkommen nach RFC 5545 (`FREQ` bis `YEARLY`, `INTERVAL`, `BYDAY` mit Ordnungszahl, `BYMONTHDAY` auch negativ, `BYMONTH`, `BYYEARDAY`, `BYWEEKNO`, `BYSETPOS`, `WKST`; der Start zählt immer als erster Termin). Die übrigen Felder sind dann nur eine Annäherung. Der Dialog zeigt **Eigene Regel** mit Hinweis und behält sie, solange keine andere Wiederholung gewählt wird. `recurrence.dates` hält zusätzliche Tage (`RDATE`), höchstens 100, nicht an `until`/`count` gebunden. Beim Aufteilen einer Serie wandern die Tage ab dem Teilungsdatum mit.
- Ende der Serie: **nie**, **an einem Datum** (letzter möglicher Termin, inklusiv) oder **nach einer Anzahl** von Terminen (1 bis 999). Gezählt werden alle erzeugten Termine, auch später gelöschte oder herausgelöste.
- Unter den Feldern steht eine Zusammenfassung, zum Beispiel „Wöchentlich am Montag und Mittwoch bis 30.11.2026“
- Wiederkehrende Termine tragen im Raster ein Wiederholungssymbol, der Tooltip zeigt die Regel
- **Bearbeiten und Löschen** fragen bei Serien, wofür die Aktion gilt:
  - *Nur dieser Termin:* Das Datum wird in der Serie ausgenommen. Beim Bearbeiten entsteht ein Einzeltermin mit den neuen Werten, der mit der Serie verknüpft bleibt.
  - *Dieser und alle folgenden:* Die Serie endet am Vortag. Beim Bearbeiten beginnt ab diesem Termin eine neue Serie mit den neuen Werten. Bei „Endet nach Anzahl“ übernimmt sie die verbleibende Anzahl. Wird nur angeboten, wenn es vorher noch Termine gibt.
  - *Alle Termine:* Die Änderung gilt für die ganze Serie. Wird der Termin dabei um Tage verschoben, verschiebt sich die ganze Serie mit.
  - Wird die Wiederholungsregel selbst geändert, gibt es nur „Dieser und alle folgenden“ und „Alle Termine“, beim ersten Termin wird ohne Nachfrage die ganze Serie geändert.
- **Herausgelöste Einzeltermine** gehören weiter zur Serie: Sie werden mit „Alle Termine“ bzw. „Dieser und alle folgenden“ gelöscht, und wechseln bei einer Aufteilung zur neuen Serie.
- Wird ein Termin in eine andere Woche verschoben, springt der Kalender nach dem Speichern dorthin

## Termin-Dialog

Der Dialog ist in Tabs aufgeteilt (`components/Tabs.tsx`), damit er kompakt bleibt:

- **Allgemein:** Titel, Ganztägig, Beginn, Ende, Zeitzone, Erinnerung
- **Darstellung:** Farbe und Kategorien (mit „+ Neue Kategorie“)
- **Wiederholung:** Wiederholungsregel
- **Teilnehmer:** nur in Teamkalendern mit Mitgliedern, mit Anzahl im Tab
- **Details:** Ort, Webseite & Links, Beschreibung

Beim Speichern mit Fehlern springt der Dialog zum ersten Tab mit Fehlern, sofern der aktuelle keine hat. Tabs mit Fehlern tragen einen roten Punkt. Welches Feld zu welchem Tab gehört, steht in `TAB_FIELDS` in `EventModal.tsx`.

## Ort, Links, Erinnerungen, Teilnehmer

- **Links** (`links`, bis zu 10, je `url` bis 2000 und `label` bis 100 Zeichen): im Tab „Details“. Adressen ohne Schema bekommen `https://` vorangestellt, erlaubt sind nur `http` und `https` (`isWebUrl` in `domain/event.ts`). Gespeicherte oder importierte Links mit anderem Schema werden beim Einlesen verworfen, damit nie ein `javascript:`-Link angezeigt wird. Gültige Links lassen sich direkt aus dem Dialog in einem neuen Tab öffnen. Im Raster stehen sie mit Weltkugel unter dem Ort, sobald der Termin hoch genug ist (ab 2,5 Stunden ein Link, je weitere halbe Stunde einer mehr, was nicht passt als „+N“ hinter dem letzten). Ein Klick öffnet den Link in einem neuen Tab, nicht den Termin. Damit Links im Termin klickbar sein dürfen, ist der Block ein `div`, über dem ein unsichtbarer Button (`.eventOpen`) die ganze Fläche zum Öffnen abdeckt. Ziehen startet nicht auf einem Link. In der schmalen Wochenansicht am Handy sind die Links ausgeblendet, im Tooltip stehen sie immer. Im iCalendar wird der erste Link als `URL`, alle weiteren als `ATTACH` geschrieben, die Bezeichnung als Parameter `LABEL`.
- **Ort** (`location`, bis 200 Zeichen): im Tab „Details“. Der Ort lässt sich im Dialog (Stecknadel neben dem Feld), im Termin im Raster und auf der Antwortseite in einer Karte öffnen, standardmäßig Google Maps. Der Host stellt mit `map-url` einen anderen Dienst ein (`{query}` wird durch den Ort ersetzt, `domain/location.ts`). Ist der Ort selbst eine Webadresse, z. B. ein Videocall-Link, öffnet der Link direkt diese Adresse. Im Raster ab 90 Minuten in eigener Zeile, darunter hinter dem Titel, in der Monatsansicht hinter dem Titel, im Tooltip und in der Suche.
- **Erinnerung** (`reminders`, Minuten vor Beginn, bis zu 5, im Dialog wird eine eingestellt): Auswahl von „Zum Beginn“ bis „1 Woche vorher“, Texte über `format.duration` (Intl, je Sprache richtig gebeugt). Erinnerungen sind persönlich: das Test-Backend speichert sie je Nutzer (`remindersByUser`) und liefert nur die eigenen. Solange das Widget offen ist, lädt `features/reminders/hooks/useReminders.ts` alle fünf Minuten die nächsten vier Wochen aller Kalender und plant die fälligen Erinnerungen. Gezeigt wird eine Browser-Benachrichtigung (Erlaubnis wird beim Wählen einer Erinnerung angefragt) oder sonst ein Hinweis unten rechts. Bereits gezeigte Erinnerungen merkt sich der Browser zwei Tage lang, damit mehrere Tabs nicht doppelt erinnern. E-Mails bei geschlossenem Kalender sind Sache des Backends. Ändert man im Dialog nur die Erinnerung, speichert der Kalender sie über `PUT /events/:id/reminders` (`setReminders`), ohne Rückfrage zur Serie. So können auch Mitglieder ohne Bearbeitungsrecht sich an fremde Termine erinnern lassen, und es gehen keine Änderungs-E-Mails raus.
- **Teilnehmer** (`attendees`, nur in Teamkalendern): im Dialog aus den Mitgliedern des Kalenders hinzufügen und entfernen, „Alle einladen“ fügt alle noch nicht eingeladenen Mitglieder auf einmal hinzu. Wer selbst Teilnehmer ist, antwortet mit Ja, Vielleicht oder Nein (`POST /events/:id/response`, sofort gespeichert, auch mit Leserechten). Unbeantwortete Termine sind schraffiert, abgesagte durchgestrichen.

## Suche

**Suchen** im Kalendermenü (oder `/`) öffnet die Suche über Titel, Ort, Beschreibung und Links der angezeigten Kalender (ab 2 Zeichen, 250 ms Verzögerung). Treffer stehen nach dem nächsten Vorkommen sortiert, vergangene danach. Ein Klick springt zum Datum und öffnet den Termin. Das Backend sucht über `GET /events/search`. Adapter ohne `search` werden über das letzte und nächste Jahr aus `GET /events` durchsucht (`features/calendar/utils/search.ts`).

## Import und Export (iCalendar)

In den Kalender-Einstellungen (Tab „Import & Export“, beim persönlichen Kalender als Abschnitt). Export lädt alle Termine des Kalenders als `.ics`, Import braucht das Recht zum Anlegen. `domain/ical.ts` schreibt und liest iCalendar: Ganztägig, Zeitzonen (`TZID`, UTC), Serien (`RRULE` mit FREQ, INTERVAL, BYDAY, UNTIL, COUNT), Ausnahmen (`EXDATE`, abgelöste Termine über `RECURRENCE-ID`), Ort, Beschreibung, Erinnerungen (`VALARM`) und Teilnehmer. Nicht unterstützte Regeln werden als einzelner Termin übernommen. Beim Import werden Termine mit bekannter `uid` aktualisiert (Farbe bleibt), neue angelegt, ungültige übersprungen (`features/events/utils/icalExchange.ts`).

## Zuletzt gewählter Kalender

Der aktive Kalender wird je Nutzer im Browser gespeichert (`calendar.activeCalendar.v1.<userId>`) und nach dem Neuladen wiederhergestellt. Bis die Kalender geladen sind, werden keine Termine des persönlichen Kalenders angezeigt. Gibt es den Kalender nicht mehr, gilt wieder der persönliche.

## Termine verschieben

- Termin **mindestens 1 Sekunde gedrückt halten** (Maus oder Finger), dann ziehen. Kürzeres Drücken oder Bewegen vorher verschiebt nichts, ein normaler Klick öffnet den Dialog.
- Tag- und Wochenansicht: in 15-Minuten-Schritten, auch auf andere Tage. Der untere Rand eines Termins ändert das Ende. Am Rand scrollt das Raster mit.
- Monatsansicht und Ganztags-Zeile: tageweise.
- Serien fragen nach dem Loslassen „nur dieser / dieser und folgende / alle“. Bei „folgende“ und „alle“ wandert der Wochentag wöchentlicher Serien mit.
- Escape bricht ab. Ohne Recht zum Anlegen ist Verschieben aus.
- Umsetzung: `features/calendar/hooks/useEventDrag.ts` (was gezogen wird), `utils/eventDrag.ts` (Rechnen, getestet). Gedrückt halten, Maus und Touch, Mitscrollen am Rand, Escape und das Unterdrücken des Klicks danach stecken in `hooks/usePressDrag.ts`, das auch das Aufziehen eines Zeitraums nutzt.

## Darstellung von Terminen

- Position und Höhe entsprechen exakt Uhrzeit und Dauer
- **Überlappende Termine** stehen nebeneinander und teilen sich die Spaltenbreite, zum Beispiel 2 Termine je 50 % und 3 Termine je 33 %. Die Tagesspalten behalten ihre Breite.
- Kurze Termine werden kompakter dargestellt, ab 90 Minuten wird zusätzlich die Uhrzeit angezeigt
- **Mehrtägige Termine** werden pro Tag als eigener Abschnitt im Raster gezeigt: am ersten Tag ab Beginn bis 24:00, dazwischen ganztägig, am letzten Tag ab 00:00 bis zum Ende. An den Übergängen sind die Ecken eckig, damit der Zusammenhang sichtbar bleibt. Die Zeitangabe enthält dann auch die Daten, zum Beispiel `30.10. 10:00 – 03.11. 16:00`.

## Zeitraum aufziehen

In der Tages- und Wochenansicht lässt sich ein Zeitraum direkt im Raster auswählen. Danach öffnet sich „Neuer Termin“ mit Startdatum, Beginn, Enddatum und Ende schon ausgefüllt.

- **Maus:** auf eine Stunde drücken und ziehen, auch über mehrere Tage und rückwärts. Ein einfacher Klick legt wie bisher eine Stunde an.
- **Handy:** kurz gedrückt halten (ca. 0,35 s, leichte Vibration, wo das Gerät es kann), dann mit dem Finger ziehen. Ein normales Wischen scrollt weiter, Antippen legt eine Stunde an.
- **Ganze Stunden, die Kachel unter Maus oder Finger zählt mit:** von der 12-Uhr-Kachel am 6.11. bis zur 18-Uhr-Kachel am 8.11. ergibt 6.11. 12:00 bis 8.11. 19:00. Wer bis 18:00 will, zieht bis zur 17-Uhr-Kachel.
- Während des Ziehens ist der Bereich blau hinterlegt, in der ersten Spalte steht der Zeitraum. Am oberen und unteren Rand scrollt das Raster mit.
- Ohne Recht zum Anlegen (Betrachter) ist die Auswahl aus.

Die Logik steckt in `useSlotSelection` und `utils/slotSelection.ts`, die Gesten selbst in `usePressDrag` (Maus über Pointer-Events sofort, Touch über Touch-Events nach langem Drücken, damit das Scrollen erst dann gesperrt wird). Den Termin baut `createEventInputForSlots` aus erster und letzter Stunde.

## Termine und Kalender

Jeder Termin gehört genau zu einem Kalender (`calendarId`). Geladen werden nur die Termine der sichtbaren Kalender (`visibleCalendarIds`):

- **Persönlicher Kalender offen:** die persönlichen Termine plus die Termine aller Team-Kalender, bei denen „Auch im persönlichen Kalender anzeigen“ an ist.
- **Team-Kalender offen:** nur die Termine dieses Team-Kalenders. **Persönliche Termine erscheinen nie in einem Team-Kalender.**

**Herkunft im persönlichen Kalender:** Termine aus Team-Kalendern tragen dort ein kleines Team-Symbol vor dem Titel (Woche, Tag und Monat). Ab zwei Stunden Länge steht der Name des Kalenders zusätzlich im Termin, darunter reicht der Platz nicht. Der Tooltip nennt immer „Aus dem Kalender „…““, und der Bearbeiten-Dialog zeigt oben: „Aus dem Kalender „…“. Änderungen sehen alle Mitglieder.“ Im Team-Kalender selbst entfällt das, dort zeigt die Plakette den Kalender. Umgesetzt über `eventSources`, eine Zuordnung Kalender-ID → Name und Farbe, die `CalendarPage` an `Calendar` gibt.

**Rechte:** Jeder Kalender bringt die Berechtigungen der eigenen Rolle mit (`permissions`, siehe `Permission` in `api/openapi.yaml`). Fehlt `create_entry` (Betrachter), verschwindet der Plus-Button und ein Klick ins Raster legt nichts an. Bearbeiten und Löschen prüft der Server; ohne Recht erscheint im Dialog „Dazu fehlt dir die Berechtigung.“

Neue Termine landen immer im gerade offenen Kalender. Beim Bearbeiten bleibt ein Termin in seinem Kalender, auch herausgelöste Termine und fortgesetzte Serien. Beim Abmelden oder Kontowechsel wird die Kalenderauswahl zurückgesetzt, damit nichts versehentlich in einen fremden Kalender geschrieben wird.

## Kalender-Einstellungen

Eigene Seite `/calendars/:calendarId/settings` je Kalender (nur angemeldet), erreichbar über das Zahnrad in Einstellungen › Kalender. Oben führt „Zu den Einstellungen“ zurück. Bei Team-Kalendern teilen Tabs die Seite in **Allgemein** (mit Anzeige), **Mitglieder**, **Einladungen** (nur mit `invite_members`) und **Gefahrenbereich**. Mitglieder und Einladungen zeigen die Anzahl im Tab. Der Tab steht wie in den Einstellungen in der Adresse (`?tab=members`), bleibt beim Neuladen erhalten und lässt sich verlinken; das übernimmt der gemeinsame Hook `useTabParam`. Jeder Bereich zeigt nur, was die eigene Rolle darf (`permissions` des Kalenders):

| Bereich | Inhalt | Ändern dürfen |
| ------- | ------ | ------------- |
| **Allgemein** | Name, Beschreibung (nur Team), Farbe mit Vorschau | Name und Farbe mit `manage_calendars`, Beschreibung mit `manage_team`. Ohne Recht sind die Felder gesperrt. Mit `manage_team` ändert der Name auch den Teamnamen. |
| **Anzeige** | „Termine auch im persönlichen Kalender anzeigen“ | jeder für sich |
| **Mitglieder** | Name, E-Mail, Rolle; Rolle wechseln und Entfernen mit Bestätigung | `manage_members`, nur bei Rollen unterhalb der eigenen. Owner dürfen alles, auch andere zu Owner machen. |
| **Einladungen** | einladen mit E-Mail und Rolle, offene Einladungen mit Ablaufdatum, zurückziehen | `invite_members`, nur Rollen unterhalb der eigenen. Mitglieder, doppelte Einladungen und die eigene Adresse werden abgefangen. |
| **Gefahrenbereich** | Leitung übertragen, Kalender verlassen, Team löschen (mit Bestätigung, nach Verlassen oder Löschen zurück zu den Einstellungen) | Übertragen nur Owner, Verlassen jeder außer dem letzten Owner, Löschen nur mit `delete_team` (Owner) |

**Leitung übertragen:** Ein Fenster listet alle Mitglieder außer dir und bestehenden Owners, oben mit Suche nach Name oder E-Mail. Nach Auswahl und „Bestätigen“ folgt eine zweite Rückfrage, die den neuen Owner nennt und sagt, was sich ändert. Erst „Endgültig übertragen“ ruft `POST /teams/:teamId/transfer-ownership` auf: Das Mitglied wird Owner, du wirst Administrator, beides in einem Schritt. Danach verschwinden „Leitung übertragen“ und „Team löschen“, Verlassen ist möglich.

Der persönliche Kalender hat die Tabs **Allgemein** (Name und Farbe, Hinweis, dass er sich nicht teilen oder löschen lässt), **Buchungsseiten**, **Import & Export** und **Papierkorb**. Ohne Zugriff (z. B. nach dem Entfernen) zeigt die Seite „Diesen Kalender gibt es nicht, oder du hast keinen Zugriff mehr.“

Die Seite liegt in `features/calendars/components/settings/`, Mitglieder und Einladungen lädt `useTeam`. Bestätigungen laufen über den allgemeinen `ConfirmModal` aus `components/` zusammen mit `useConfirm`, auch „Kalender verlassen“ in der Liste und der Papierkorb. Die Tabs „Buchungsseiten“, „Austausch“ und „Papierkorb“ beschreibt `useCommonTabs` einmal für persönliche und Team-Kalender; bedingte Tabs stehen mit `bedingung && { … }` in der Liste, `compact` entfernt die leeren.

## Kalender erstellen

Eigene Seite `/calendars/new` (nur angemeldet, sonst Anmeldung und danach zurück). Erreichbar über die Kachel **Neuer Kalender** in „Kalender wechseln“ und den Button **Kalender erstellen** in den Einstellungen.

Die Erstellung läuft in Schritten, oben zeigt ein `Stepper` den Fortschritt. Erledigte Schritte lassen sich anklicken, um zurückzuspringen. Eingaben bleiben dabei erhalten.

1. **Name:** Name (Pflicht, bis 80 Zeichen) und Beschreibung (optional, bis 500 Zeichen)
2. **Farbe:** gleiche Auswahl wie bei Terminen, mit Vorschau des Kalenders
3. **Mitglieder:** E-Mail und Rolle eingeben, **Hinzufügen** oder Enter. Unter der Auswahl steht, was die Rolle darf. Geprüft wird: gültige Adresse, nicht doppelt, nicht die eigene, höchstens 50. Der Schritt ist optional.
4. **Überprüfen:** Zusammenfassung mit Vorschau, dann **Kalender erstellen**

Danach ist der neue Kalender aktiv und man landet im Kalender. Der Ersteller ist Owner.

Angelegt wird über `POST /calendars` mit Name, Beschreibung, Farbe und Einladungen. Der Server macht dich zum Owner und verschickt die Einladungen per E-Mail.

## Einstellungen

Seite `/settings`, erreichbar über **Einstellungen** im Kontomenü (runder Button mit dem Anfangsbuchstaben). Mit `VITE_FEATURE_AUTH=true` nur für Angemeldete: `/settings` leitet sonst zum Kalender um, auch direkt nach dem Löschen des Kontos. Ohne Anmeldefunktion gibt es kein Kontomenü, dann stehen die Einstellungen im Kalendermenü (☰ links in der Kopfzeile).

Oben wechseln Tabs zwischen **Kalender**, **Einladungen** (nur mit bestätigter E-Mail und Team-Funktionen, Anzahl offener Einladungen im Tab), **Darstellung** (Sprache und Region, Farbschema, Startansicht, eigene Farben) und **Konto** (nur angemeldet). Der gewählte Tab steht in der Adresse (`/settings?tab=appearance`), bleibt also beim Neuladen erhalten und lässt sich verlinken. Pfeiltasten links/rechts wechseln den Tab.

Die Seite nutzt die volle Breite: links Titel und Erklärung jedes Abschnitts, rechts die Einstellungen. Auf dem Handy untereinander.

- **Kalender:** alle Kalender, auf die man Zugriff hat (persönlich und Teams), mit Farbe, Team und eigener Rolle. Bei Team-Kalendern legt ein Schalter fest, ob ihre Termine **auch im persönlichen Kalender** erscheinen (`showInPersonal`, Standard an). Team-Kalender lassen sich mit Bestätigung **verlassen**, außer man ist Owner. Der persönliche Kalender lässt sich nicht entfernen. Schalter und Verlassen werden sofort auf dem Server gespeichert.
- **Zahnrad an der Kachel** führt zur Einstellungsseite des Kalenders (siehe [Kalender-Einstellungen](#kalender-einstellungen)). Es erscheint beim persönlichen Kalender immer und bei Team-Kalendern nur mit einer Rolle, die dort etwas verwalten darf (Owner, Administrator, Verwalter).
- **Einladungen:** Offene Einladungen an die eigene E-Mail-Adresse stehen oben mit Team, Beschreibung, Rolle, Absender und Ablaufdatum. **Annehmen** nimmt den Kalender sofort in die Liste und in „Kalender wechseln“ auf, **Ablehnen** entfernt die Einladung.
- **Sprache und Region:** Automatisch (Browser bzw. Vorgabe des Gastgebers) oder eine der mitgelieferten Sprachen mit Region. Wirkt sofort, siehe [Sprache und Region](02-embedding.md#sprache-und-region).
- **Farbschema:** Wie System, Hell oder Dunkel. Gesetzt über `data-theme` am `<html>`, die Farben kommen weiter aus `light-dark()`.
- **Startansicht** getrennt für Computer/Tablet und Handy
- **Eigene Farben** ansehen und entfernen. Termine mit dieser Farbe behalten sie.
- Gespeichert in diesem Browser unter `calendar.preferences.v1` (Farben weiter unter `calendar.colors.v1`). Beim ersten Start legt die App beide Einträge mit Standardwerten an: Farbschema `system`, Startansicht Woche bzw. Tag auf dem Handy, Sprache `auto`, keine eigenen Farben. Vorhandene Werte bleiben unverändert. **Angemeldet** liegen Einstellungen und Farben auf dem Server (`/preferences`, `/colors`) und gelten auf jedem Gerät.
- Angemeldet kommen die Konto-Abschnitte dazu, siehe [Konto in den Einstellungen](07-sign-in.md#konto-in-den-einstellungen).

## Farben

- Vier Standardfarben: Blau, Rot, Grün, Gelb
- Über den grauen **+**-Kreis lassen sich **eigene Farben** hinzufügen, maximal 12
- Eigene Farben werden gespeichert und stehen in jedem Termin wieder zur Auswahl. Entfernen lassen sie sich in den Einstellungen.
- Die Schriftfarbe auf eigenen Farben wird automatisch hell oder dunkel gewählt

## Bedienung

| Aktion                | Tastatur / Maus                    |
| --------------------- | ---------------------------------- |
| Zurück (Tag, Woche, Monat, Jahr) | `←` oder linker Pfeil im Header    |
| Vor (Tag, Woche, Monat, Jahr)    | `→` oder rechter Pfeil im Header   |
| Zu heute                         | `T` oder **Heute** im Header       |
| Ansicht wechseln                 | `D` / `W` / `M` / `Y` (auch `J`) / `A` / `K` oder Tag / Woche / Monat / Jahr / Agenda / Aufgaben |
| Neuer Termin (in der Aufgabenansicht: neue Aufgabe) | `N` oder **+** im Header |
| Suche                            | `/` oder **Suchen** im Kalendermenü |
| Letzte Aktion rückgängig         | `Strg+Z` / `⌘Z`, solange der Hinweis sichtbar ist |
| Fenster schließen                | `Esc` oder Klick neben das Fenster |
| Termin per Tastatur anlegen      | Mit `Tab` ins Raster der Tages- oder Wochenansicht, mit den Pfeiltasten die Uhrzeit wählen (`↑` / `↓` eine Stunde, `←` / `→` ein Tag, `Pos1` / `Ende` 0 bzw. 23 Uhr), `Enter` öffnet den Dialog |
| Zwischen Terminen wechseln       | Auf einem Termin: `↑` / `↓` im selben Tag, `←` / `→` zum nächsten Tag mit Terminen, `Pos1` / `Ende` zum ersten / letzten Termin |

Die Kürzel wirken, wenn der Fokus im Kalender liegt oder nirgends (z. B. direkt nach dem Laden oder nach dem Schließen eines Fensters). Sind mehrere Kalender auf der Seite, reagiert der zuletzt benutzte, anfangs der erste. Solange ein Eingabefeld, ein Fenster oder ein Element der Host-Seite den Fokus hat, sind sie aus. So bleibt z. B. `Strg+Z` in Eingabefeldern das normale Rückgängig des Browsers (`hooks/useKeyboardShortcuts.ts`, die Tasten stehen in `Calendar.tsx`, die Ansichtstasten in `VIEW_SHORTCUTS`). Die Tooltips der Buttons im Header und die Einträge im Kalendermenü nennen die Taste. `?` und der Menüeintrag **Tastenkürzel** öffnen eine Übersicht (`ShortcutHelp`).

**Tipps beim ersten Start** (Schalter `tips`, `OnboardingTips`): eine kleine Karte unten rechts mit bis zu sechs Tipps nacheinander, passend zu den eingeschalteten Funktionen und zum Gerät (Wischen statt Tastenkürzel auf Touch-Geräten). **Überspringen** oder **Alles klar** merkt sich das je Nutzer und Gerät im localStorage (`calendar.tipsSeen.v1.<Nutzer-ID oder guest>`). In den Browser-Tests ist der Schalter aus (`VITE_FEATURE_TIPS=false`), der Test-Harness schaltet ihn nur ein, wenn `tips` ausdrücklich genannt ist.

**Barrierefreiheit:** Die Pfeiltasten auf einem Termin übernimmt `useEventNavigation` (vor den globalen Kürzeln, deshalb blättert `←` / `→` dort nicht den Zeitraum). Tage und Monatszellen sind Gruppen mit Datum, „heute“ und Feiertag als Namen (`getDayLabel`), Termine haben einen vollständigen Namen (`getEventLabel`, bei Chips sichtbarer Text plus versteckte Details). Der Titel im Header ist eine Live-Region. Gedämpfter Text ist `#616161` (hell), im Dunkelmodus steht dunkler Text auf Eventfarben und Akzent. Geprüft mit axe-core in allen Ansichten, im Dialog, im Kalendermenü und in den Einstellungen, hell und dunkel.

## Feiertage

- Gesetzliche Feiertage (nur arbeitsfreie, `type: 'public'`) stehen in Tag- und Wochenansicht in der Ganztägig-Zeile, im Monat unter der Tageszahl und im Jahr als rote Tageszahl mit Name im Tooltip. Das Datum selbst ist rot.
- **Quelle:** die Bibliothek `date-holidays` (Regeln für über 200 Länder und deren Regionen, von der Community gepflegt, Daten unter CC BY-SA 4.0). Sie wird erst geladen, wenn Feiertage angezeigt werden (`features/holidays/utils/holidayLibrary.ts`, eigener Chunk). Gesetzesänderungen kommen mit einem Update des Pakets, gepflegt wird hier nichts.
- **Backend als Quelle:** Mit `holiday-source="backend"` fragt die Komponente `GET /holidays?from&to&region&lang`. Schlägt das fehl, nimmt sie die Bibliothek. Eigene Adapter können ein `holidays`-Repository mitgeben.
- **Welche Region:** Einstellung „Feiertage“ unter Darstellung (`preferences.holidays`: `auto`, `off` oder z. B. `DE-NW`) vor Host-Attribut `holidays` vor dem Land aus der Sprache (`de-DE` → `DE`, `fr` → `FR`, `domain/holidays.ts`). In den Einstellungen wählt man Land und optional Bundesland bzw. Region. Ländernamen kommen aus `Intl.DisplayNames`, weil die Bibliothek nicht alle übersetzt.

## Kalender-Abo

In den Kalender-Einstellungen (Tab „Import & Export“, beim persönlichen Kalender als Abschnitt) erstellt man einen geheimen Abo-Link, den Google Kalender, Outlook oder Apple Kalender abonnieren (`SubscribeSection.tsx`). Der Link ist je Nutzer und Kalender, enthält die eigenen Erinnerungen und lässt sich kopieren, als `webcal://` öffnen, neu erzeugen (der alte wird ungültig) oder beenden. Der Abschnitt erscheint nur, wenn das Repository `getFeed`, `createFeed` und `deleteFeed` hat und das Backend `GET /calendars/:id/feed` kennt, im lokalen Modus also nicht. Wie man den Link in Apple Kalender, Google Kalender, Outlook und Thunderbird einbindet und wie schnell die Apps Änderungen holen, steht im Developer Guide unter „Calendar subscriptions“.

## E-Mails zu Terminen

Verschickt werden sie vom Backend, der Kalender speichert nur die Wahl des Nutzers: neuer Tab **Benachrichtigungen** in den Einstellungen (nur angemeldet) mit `emailInvites`, `emailChanges` und `emailReminders`. Einladungs-E-Mails enthalten Links „Ja“, „Vielleicht“, „Nein“ auf `/respond?status=…&token=…`. Die Seite `pages/RespondPage.tsx` speichert die Antwort aus dem Link ohne Anmeldung (`POST /events/email-response`, über das Auth-Repository, weil das auch ohne Sitzung erreichbar ist), zeigt Titel, Zeit in der eigenen Zeitzone und Ort und lässt die Antwort ändern. Was das Test-Backend dafür tut, steht in dessen README.

## Chat zu Terminen

- Nur in Teamkalendern und nur angemeldet. Termine haben im Dialog einen Tab **Chat**, im Raster zeigt eine rote Plakette die ungelesenen Nachrichten.
- **Ein Chat pro Termin**, bei Serien pro Vorkommen. Der Schlüssel ist `{ eventId, occurrenceDate }` (`features/chat/utils/chat.ts`, `getChatKey`): Einzeltermine `occurrenceDate: null`, Serien das Datum des Vorkommens, herausgelöste Termine die ID ihrer Serie und ihr ursprüngliches Datum, damit der Verlauf beim Verschieben eines einzelnen Termins erhalten bleibt.
- **Rechte:** alle Mitglieder lesen und schreiben, eigene Nachrichten bearbeiten und löschen, mit `manage_calendars` (Owner, Admin, Manager) alle löschen.
- **Live:** Chat und Live-Updates teilen sich eine WebSocket-Verbindung (`LiveSocket` in `utils/liveSocket.ts`, Pfad `/chat/socket`). Sie besteht, solange etwas zuhört, schickt alle 25 Sekunden ein Ping und verbindet sich nach Abbrüchen mit wachsender Pause neu. Nach dem Neuverbinden lädt der offene Chat nach und die Zähler werden neu geholt. Senden, Bearbeiten und Löschen laufen über REST.
- **Ungelesen:** `useChatUnread` lädt die Zähler der sichtbaren Teamkalender, zählt neue Nachrichten anderer live hoch und setzt einen Chat auf null, solange er offen ist. Gelesen wird erst, wenn der Tab „Chat“ wirklich angezeigt wird.
- **E-Mail-Link:** `?calendar=…&event=…&date=…&tab=chat` wählt den Kalender, springt zum Datum und öffnet den Termin im Chat-Tab (`CalendarPage`, `openEvent` in `Calendar`). Beim Schließen verschwinden die Parameter aus der Adresse.
- Code: `features/chat/` (ChatPanel, ChatProvider, UnreadBadge, Hooks), Repository in `features/chat/repositories/RemoteChatRepository.ts`. Die Vite-Weiterleitung für `/api` reicht WebSockets mit durch (`ws: true`).

## Kategorien

- Kategorien gehören zu einem Kalender (`domain/category.ts`, höchstens 30 pro Kalender, Namen ohne Groß-/Kleinschreibung eindeutig). Termine tragen bis zu 5 davon in `categoryIds`.
- Feste Kategorien (`BUILTIN_CATEGORIES`: `work`, `leisure`, `household`, `family`, `health`, `sport`, `learning`) hat jeder Kalender, beliebig viele pro Termin und Aufgabe in `builtinCategories`, getrennt von `categoryIds` und ohne Grenze von 5. `CategoryField` zeigt sie zuerst (Texte unter `events.categories.builtin`), `CategoryFilterModal` ebenso (Filter-Id `builtin:<name>`, `builtinFilterId`, `matchesCategoryFilter`). Beim Verschieben bleiben sie. Der Planer zählt einen Termin als Arbeit, sobald `work` dabei ist (`isWorkCategorized`).
- Verwaltung in den Kalender-Einstellungen (`CategoriesSection`), Zuordnung im Termin-Dialog (`CategoryField`, dort auch „+ Neue Kategorie“). Verwalten darf, wer `manage_calendars` hat, und im persönlichen Kalender immer der Besitzer (`canManageCategories` in `permissions.ts`, weil der lokale persönliche Kalender kein `manage_calendars` hat), Filter über das Kalendermenü (`CategoryFilterModal`). Der Filter lebt nur im Zustand von `Calendar` und kennt zusätzlich „Ohne Kategorie“. Unbekannte Ids (gelöschte Kategorien) zählen als „ohne“.
- Export und Import: `toICalendar` schreibt die Namen als `CATEGORIES`, `parseICalendar` liefert sie als `categoryNames`. Beim Import ordnet `createCategoryResolver` (`features/events/utils/icalExchange.ts`) sie über den Namen zu und legt fehlende an, wenn man den Kalender verwalten darf. Hat die Datei keine Kategorien, behält ein bekannter Termin seine.
- Speicherung über `CategoryRepository` (lokal `LocalCategoryRepository`, sonst `RemoteCategoryRepository`). Fehlt das Repository im Daten-Adapter, gibt es die Funktion nicht.

## Anhänge

- Modell und Prüfungen in `features/attachments/utils/attachment.ts` (höchstens 20 Dateien pro Termin, je 10 MB, Name ohne Pfad und Steuerzeichen). Speicherung über `AttachmentRepository`, nur mit Backend (`RemoteAttachmentRepository`: Upload als `multipart/form-data`, Download als Blob über den API-Client mit `responseType: 'blob'`, damit auch Bearer-Token funktionieren).
- `AttachmentsField` (`features/attachments`) steht im Tab „Details“ des Termin-Dialogs, außerhalb des gesperrten `fieldset`, damit der Download auch im Nur-Lesen-Modus geht. Beim Anlegen sammelt das Feld die Dateien, `Calendar.handleSave` lädt sie nach dem Speichern hoch und meldet fehlgeschlagene über `actionError`.
- Hochladen und Löschen nur mit Bearbeitungsrecht (`canEditEntry` in `permissions.ts`, dafür liefert `parseCalendarEvent` jetzt `createdBy`). Termine tragen `attachmentCount` für die Büroklammer in `EventTitle`.

## Nur-Lesen-Modus und öffentliche Links

- `readOnly` (Option des Gastgebers) landet im `HostContext`. `Calendar` setzt damit `canCreate` auf `false`, der Termin-Dialog zeigt seine Felder in einem deaktivierten `fieldset` und nur noch „Schließen“, der Import ist ausgeblendet.
- Öffentlicher Link: `ShareSection` in den Kalender-Einstellungen holt ein Token (`getShare`, `createShare`, `deleteShare` am `CalendarRepository`) und baut daraus mit `buildSharedLink` die Adresse, je nach Routing über den Link-Parameter der Gastgeberseite oder als `/shared/:token`.
- Die Seite `/shared/:token` (`SharedCalendarPage`) braucht keine Anmeldung. Sie lädt den Kalender über `SharedCalendarRepository` und setzt einen eigenen `StorageProvider` mit nur lesenden Repositories um die normale `Calendar`-Komponente.

## Überschneidungen, Drucken, Buchungsseiten

- **Überschneidungen** (Schalter `overlapWarnings`): `OverlapNotice` im Termin-Dialog prüft 400 ms nach der letzten Eingabe über `Calendar.checkOverlaps`, ob der Zeitraum andere Termine der angezeigten Kalender schneidet (`findOverlaps` in `domain/overlap.ts`, Vergleich als Zeitpunkte in der Zeitzone des Betrachters). Ganztägige Termine, der Termin selbst und abgelehnte Einladungen zählen nicht. Gezeigt werden höchstens drei, dahinter „+N“. Nur ein Hinweis, Speichern bleibt möglich; nicht im Nur-Lesen-Modus und nicht bei CalDAV-Terminen.
- **Kalendermenü:** Der Button ☰ links in der Kopfzeile öffnet eine Leiste von links (`CalendarMenu`, `Modal` mit `placement="start"`) mit **Suchen**, **Nach Kategorie filtern** (nur mit Kategorien, Markierung „aktiv“ und Punkt am Button, solange ein Filter wirkt), **Drucken** und ohne Kontomenü **Einstellungen**. Seiten geben weitere Einträge über die Prop `menuItems` von `Calendar` mit (Aktion oder Link). Ein Eintrag schließt die Leiste, der Fokus geht danach zurück auf ☰. In der Kopfzeile bleiben Blättern, Heute, Titel, Ansichten, **+**, Glocke und Kontomenü. Ohne Einträge gibt es keinen ☰.
- **Drucken** (Schalter `print`): Eintrag im Kalendermenü. `buildPrintDocument` (`features/calendar/utils/print.ts`) baut aus dem sichtbaren Zeitraum ein eigenes HTML-Dokument (Liste je Tag, im Monat ein Raster mit Feiertagen, alle Texte maskiert), `printDocument` druckt es in einem unsichtbaren `iframe` und räumt danach auf. Speichern als PDF geht über den Druckdialog des Browsers.
- **Buchungsseiten** (Schalter `bookingPages`, nur mit Backend): Tab „Buchungsseiten“ in den Kalender-Einstellungen (persönlich und Team, mit `manage_calendars`), Code in `features/bookings/`. `BookingPageForm` mit `BookingHoursField` (Zeiten je Wochentag, Ende `00:00` = `24:00`), Liste über `ManagedListSection`, Link wie beim öffentlichen Link über `buildHostLink` (`context/hostLink.ts`). Öffentliche Seiten ohne Anmeldung: `/book/:token` (`pages/BookingPage.tsx`, freie Zeiten einer Woche in der Zeitzone des Besuchers, dann Name, E-Mail, Notiz), `/booking/confirm?token=` und `/booking/cancel?token=` (`pages/BookingLinkPage.tsx`). Bestätigen und Absagen laufen erst auf Knopfdruck, damit Link-Scanner in Mailprogrammen nichts auslösen. `RemoteBookingRepository` steckt in `restDataSource`, auch für Gäste. Regeln für freie Zeiten und Grenzen stehen im DEVELOPER_GUIDE (Abschnitt 27) und in `api/openapi.yaml`.
- **Gemeinsame Bausteine:** Wiederkehrende Oberflächenteile liegen in `src/components`: `DecisionButtons` (Annehmen/Ablehnen mit Ladezustand und Fehler), `EditToggle` (Bearbeiten-Knopf, der in ein Formular umschaltet, mit optionalen weiteren Aktionen und Entfernen), `RemoveButton`/`CloseButton` (×-Knöpfe), `EmailTextField` (E-Mail-Feld mit Längengrenze) und `ConfirmModal` mit `tone="neutral"` und `details` für Bestätigungen, die nichts löschen. Zeitstempel formatiert `format.longDateOf`/`format.fullDayOf`, die Verwaltungsfelder neuer Termine (`request`, `version`, `createdAt` …) setzt `newEventMeta()` aus `domain/event.ts`. Listen ohne Aufzählungszeichen bekommen ihren Reset gesammelt in `base.css`.
- **Kalender-Links im Menü:** `CalendarPage` hängt an das Burger-Menü eine Gruppe „Kalender: <Name>“ mit Links in die Einstellungen des aktiven Kalenders. Welche Tabs es gibt, entscheidet `useCalendarSettingsTabs` (`features/calendars/hooks`); dieselbe Funktion nutzt auch `CalendarSettingsPage`, damit Menü und Tabs nie auseinanderlaufen. `CalendarMenuItem.group` fasst aufeinanderfolgende Einträge unter einer Überschrift zusammen.
- **Persönlichen Kalender freigeben** (Schalter `personalSharing`, nur mit Backend und Anmeldung): Besitzerseite im Tab „Freigabe“ des persönlichen Kalenders (`features/peers/components/SharingSection.tsx`, Einschalten nur nach Bestätigung, Einladen per E-Mail, Liste mit Entfernen). Empfängerseite: `PeerCalendarsProvider` lädt `/peer-calendars` und gibt die angenommenen Kalender an `PeerEventRepository` (`features/peers/repositories`); `withPeerEvents` legt sich in `CalendarApp` um das Termin-Repository und leitet `calendarId` `peer:<freigabe>` und Termin-IDs `peer:<freigabe>:<termin>` an die Freigabe-Endpunkte (Anfragen anlegen, ändern, zurückziehen). Verschieben, Wiederherstellen, Antworten und Erinnerungen sind dort gesperrt, die Suche lässt Peer-Kalender weg. Peer-Kalender stehen auch im `CalendarSwitcher` unter „Geteilt mit dir“ (der Wechsler erscheint dafür auch ohne `teams`, den Teams-Abschnitt dann nicht). Gewählt wird `peer:<freigabe>` über `selectCalendar` gespeichert (`activeId` im Kontext, `activeCalendar` bleibt dabei der persönliche); `CalendarPage` erkennt den Peer-Kalender daran und zeigt nur ihn (`calendarIds`, `targetCalendarId` und Kalenderfeld auf die Anfrage), ohne Aufgaben und Kalendermenü-Einträge, mit `ActiveCalendarIndicator shared`. Verschwindet die Freigabe, fällt die Ansicht auf den persönlichen Kalender zurück. Sonst hängt `CalendarPage` die angezeigten Peer-Kalender nur in der Ansicht des persönlichen Kalenders an `calendarIds` an und bietet im Kalenderfeld „Anfrage an …“; ist das gewählt, zeigt `EventModal` die Anfrage-Variante (`requestTo`: nur Titel, Zeit, Ort, Notiz). Bearbeitbar sind nur eigene offene Anfragen, zurückziehen geht immer. Belegt-Blöcke kommen ohne Inhalt vom Backend und bekommen im Frontend den Titel `m.peers.busy`. Der Schalter „Sichtbar für Personen, mit denen du deinen Kalender teilst“ (`visibility`) erscheint nur bei Terminen des persönlichen Kalenders. Offene Anfragen an den Besitzer zeigt das Termin-Fenster mit `RequestDecision` (Annehmen/Ablehnen über `personalSharing.acceptRequest/declineRequest`). Kalender anderer Personen stehen unter Einstellungen › Verbindungen (`PeerCalendarSettings`), Einladungen unter Einstellungen › Einladungen (`PeerInvitationList`, der Tab erscheint dafür auch ohne `teams`).

## Gemeinsame Zeit finden

Feature unter `features/freebusy/` (Schalter `freeBusy`, nur mit Backend und Anmeldung): `RemoteFreeBusyRepository` ruft `POST /free-busy` auf (`utils/freeBusy.ts` parst die Antwort), `CalendarApp` reicht es nur angemeldet als `freeBusy` in den Storage. `EventModal` zeigt **Gemeinsame Zeit finden** in den Reitern Allgemein und Teilnehmer, sobald ein Termin mit Uhrzeit Teilnehmer hat, und öffnet `FindTimeModal`: Dauer (anfangs die des Termins), Wochenenden, Liste der Personen mit „Belegte Zeiten bekannt“ oder „Keine Angaben“, Vorschläge für 14 Tage ab dem Termintag, vor und zurück blätterbar. `findCommonSlots` (`utils/slots.ts`) sucht im Halbstundenraster zwischen den Planungszeiten der Einstellungen, höchstens drei je Tag und zehn insgesamt, überspringt vergangene Zeiten und gesperrte Tage (`blockedDates`, ganztägige Termine mit fester Kategorie). Ein Vorschlag setzt Beginn und Ende im Formular (umgerechnet in die Zeitzone des Termins), gespeichert wird erst mit **Speichern**. Bei bestehenden, nicht wiederkehrenden Terminen geht die eigene ID als `excludeEventId` mit, damit der Termin sich nicht selbst blockiert. Antwortet der Server mit `404`, `405` oder `501`, sagt der Dialog, dass er die Suche nicht anbietet. Der Schalter **Belegte Zeiten zeigen** (`FreeBusySettings`, Einstellung `shareFreeBusy`) steht unter Einstellungen › Verbindungen › Verfügbarkeit.

## Aufgaben über CalDAV

Der CalDAV-Server des TestBE liefert mit `tasks` in jeder Kalender-Sammlung auch die Aufgaben als `VTODO` (`src/dav/tasks.ts` liest und schreibt sie, `src/dav/server.ts` kennt dafür den Knoten `task`, `src/dav/changes.ts` zählt Aufgaben im Änderungsprotokoll mit). Aufgaben haben dafür intern `uid` (sonst die ID) und einen Ressourcennamen; beides taucht in der JSON-API nicht auf. Anlegen, Ändern und Löschen laufen über `src/tasks/service.ts`, also mit denselben Folgen wie im Web (nächste Aufgabe einer Serie, Blöcke in den Papierkorb, Benachrichtigungen, `task.changed`). Im Frontend weist nur ein Satz unter Einstellungen › Verbindungen › „In anderen Programmen nutzen“ darauf hin (`caldav.server.tasksHint`, nur mit `tasks`).

## App und Push

- **PWA:** `public/manifest.webmanifest`, Icons in `public/icons` (aus `public/Icon.png` erzeugt), `public/sw.js`. `main.tsx` ruft `enableInstallPrompt()` und registriert den Service Worker nur im Production-Build (`import.meta.env.BASE_URL` + `sw.js`), damit der Dev-Server nicht aus dem Cache läuft. Der Service Worker hält die Startseite (Navigation: erst Netz, offline die gespeicherte Startseite) und Dateien unter `assets/` (erst Cache, höchstens 300 Einträge), nichts von der API oder fremden Seiten. `features/pwa/utils/installPrompt.ts` fängt `beforeinstallprompt` erst nach `enableInstallPrompt()` (für Gastgeber freiwillig), `AppInstallSettings` zeigt unter Darstellung „App installieren“ bzw. den Hinweis für iPhone/iPad. `enablePageSync()` (ebenfalls in `main.tsx`) schaltet `PageSync` ein: Es setzt `theme-color` auf die berechnete Hintergrundfarbe von `.calendarRoot` (neu bei `data-theme`, `style`, Ende der Farb-Transition und Wechsel des System-Designs) und `<html lang>` auf die Sprache des Kalenders. Die Icons in `public/icons` stammen aus `public/icons/icon.svg`.
- **Push** (Schalter `push`, mit `notifications`, nur angemeldet): `features/push/`. `RemotePushRepository` für `/push/key`, `/push/subscriptions`, `/push/subscriptions/remove`; `utils/device.ts` prüft die Unterstützung (`unsupported`, `appleNeedsInstall`, `noServiceWorker`), abonniert über die vorhandene Service-Worker-Registrierung und merkt sich Endpunkt und Nutzer in `calendar.push.v1`, damit nur das eigene Abonnement angefasst wird (`ForeignSubscriptionError`, wenn auf der Seite schon ein fremdes aktiv ist). `PushSettings` im Tab Benachrichtigungen (der Tab erscheint dafür auch ohne `emailNotifications`). `PushSync` meldet ein vorhandenes eigenes Abonnement nach dem Anmelden erneut an (neue Sitzung) und hängt über `utils/logoutHooks.ts` das Abmelden an, das `AuthProvider.logout` vor dem Abmelden ausführt.

## Aufgaben

Eigenes Feature unter `features/tasks/` (Schalter `tasks`, auch lokal): `types` (Task, TaskInput, TaskRepository, TaskAccess, TaskSetup), `utils/task.ts` (Parsen, Sortieren, Gruppen), `repositories` (`LocalTaskRepository` mit `calendar.tasks.v1`, ohne Zuständige; `RemoteTaskRepository` für `/tasks*` mit `If-Match`), `hooks` (`useTaskList` lädt je Zeitraum oder alle offenen plus die letzten erledigten, `useTaskActions` mit Neuladen über `invalidate`, `useTaskEditor`,, `useTaskLayout` für Liste oder Board in `calendar.taskLayout.v1`), `context/TasksContext.ts` (Aufgaben je Tag für die Ansichten, `useTaskRows`, Statuswechsel) und `components` (`TasksProvider` mit dem lazy geladenen `TaskModal`, `ChecklistField`, `DayTasks`/`TaskChip`, `TaskCheckbox`, `TaskDetails` für die Kennzeichen, `TasksView` mit Liste und Board).

- `CalendarPage` baut das `TaskSetup`: sichtbare Kalender, Zielkalender, Kalender mit `create_entry`, Rechte (`canEditEntry`/`canDeleteEntry` wie bei Terminen, Status und Checkliste zusätzlich für die zuständige Person: `canProgress`) und `loadAssignees` aus den Team-Mitgliedern. Der Link `?calendar=…&task=…` (Glocke, `taskAssigned`) öffnet die Aufgabe, mit `&plan=1` (Glocke `taskDueSoon`/`taskPlanConflict`, Link in der E-Mail) gleich die Planung (`openTaskPlan`, `resumePlan` mit der Standardverteilung). Im Termin-Dialog prüft `PlanConflictNotice` (wie `OverlapNotice`, 400 ms verzögert) über `Calendar.checkPlanConflicts`, ob der Termin künftige Blöcke (`taskId`) im persönlichen Kalender schneidet, sobald sein Kalender für die Planung zählt; der Knopf **Speichern und neu planen** ist ein Submit-Button mit `name="replanTask"`, `EventModal` merkt sich die Aufgabe und ruft nach erfolgreichem Speichern `onReplan`, das die Aufgabe lädt und mit offener Planung zeigt.
- `Calendar` legt `TasksProvider` um die Ansichten. Tag und Woche zeigen Aufgaben als Zeilen der Ganztägig-Spur nach dem Feiertag (Woche höchstens drei, dann „+N weitere Aufgaben“, ein Klick öffnet den Tag), Monat zeigt neben Terminen eine Zeile, Agenda alle. Abhaken ist sofort sichtbar und wird bei Fehler zurückgenommen.
- Status `open`, `inProgress`, `waiting`, `done` und Priorität `low` bis `urgent`. Offene Aufgaben sortiert nach Priorität, dann Fälligkeit (`compareTasks`), am Tag nach Fälligkeit. Ansicht „Aufgaben“: Werkzeugleiste mit **Liste / Board** und **Erstellen** rechts; die Liste zeigt je Status einen Abschnitt untereinander (Erledigt eingeklappt), das Board je Status eine Spalte nebeneinander, Karten lassen sich per Drag-and-drop (HTML5, `application/x-calendar-task`) in eine andere Spalte ziehen. Ohne Maus geht der Statuswechsel im Dialog.
- Dialog (`TaskModal`, normale Breite, Reiter wie beim Termin): **Allgemein** mit Titel, Status, Priorität, Fälligkeit, Aufwand; **Checkliste** (Anzahl im Reiter); **Details** mit Beschreibung, Kalender, Zuständig, Kategorien (`CategoryField` aus `features/categories`). Bei Fehlern springt der Dialog auf den ersten Reiter mit Fehler. Wer nur zuständig ist, sieht alles gesperrt bis auf Status und Checkliste, die sofort gespeichert werden.
- Aufwand: optional in Stunden und Minuten (`estimateMinutes`, höchstens 99 Std. 59 Min.), in der Liste an jeder Aufgabe und als Summe je Gruppe (`format.effort`, `sumTaskEstimates`).
- Beim Anlegen schaltet **Termin / Aufgabe** oben im Dialog um, Titel und Datum wandern mit.
- Antwortet `GET /tasks` mit `404`, `405` oder `501`, verschwinden Ansicht, Umschalter und Einträge (`isUnsupportedEndpoint`). Im Nur-Lesen-Modus sind Aufgaben nur sichtbar.
- Live: `task.changed` vom WebSocket wird in `domain/eventChange.ts` wie eine Terminänderung ohne Termin-ID behandelt und lädt neu.
- Wiederholung: `recurrence` (Typ der Termine, ohne `rule`/`dates`, nur mit Fälligkeit) im Reiter Allgemein über `RecurrenceFields`; `nextTaskOccurrence` (`utils/task.ts`) liefert die nächste Fälligkeit nach `dueDate` und zählt `count` herunter. Lokal legt `LocalTaskRepository` beim Wechsel auf erledigt die nächste Aufgabe an und nimmt der erledigten die Wiederholung; das Backend macht dasselbe. Badge in `TaskDetails` mit `formatRecurrence`.
- **Einplanen** (`TaskPlanModal`, lazy aus `TaskModal`): für gespeicherte, offene Aufgaben, wenn `TaskSetup.planning` gesetzt ist; Knopf als `outline`, damit er sich von „Abbrechen“ abhebt, ohne Aufwand gesperrt mit Hinweis als `title` (auch am umgebenden `.buttonHint`, weil gesperrte Knöpfe sonst keinen Tooltip zeigen) (`CalendarPage`: persönlicher Kalender als Ziel, alle eigenen, Team-, CalDAV- und geteilten Kalender plus Abos als belegt). Ungespeicherte Änderungen an Fälligkeit oder Aufwand sperren den Knopf. Hat die Aufgabe künftige Blöcke (`useHasFutureBlocks`, lädt nach jedem `invalidate` neu) oder wurde gerade angelegt, heißt er „Neu planen“. `useTaskPlanner` lädt Termine von gestern bis ein Jahr voraus, Feiertage (`listHolidays`) und die bisherigen Blöcke der Aufgabe (`taskId`), rechnet alles in Minuten der Anzeige-Zeitzone um und ruft `planTask` (`utils/taskPlanner.ts`, rein, mit Tests). Begonnene Blöcke zählen als erledigt, künftige werden beim Anlegen erst gelöscht, dann neu angelegt (privat, `taskId`, feste Kategorien der Aufgabe oder `work`).
- **Vorschau im Kalender:** „Im Kalender ansehen“ gibt ein `TaskPlanPreview` (Blöcke, ersetzte IDs, `save`) über `TasksProvider.onPlanPreview` an `Calendar`. Der schließt die Dialoge, merkt sich Ansicht und Datum, springt in die Woche des ersten Blocks, blendet ersetzte Blöcke aus und mischt `toPlanPreviewEvents` (IDs `planPreview:<n>`, `isPlanPreviewEvent`) in die Termine. Die bekommen die Klasse `eventPlanned`, sind nicht klick- oder ziehbar, und solange die Vorschau läuft, wird nichts neu angelegt. Kopfzeile: `TaskPlanPreviewActions` (Abbrechen, Sichern) statt des Host-Zubehörs, darunter `TaskPlanPreviewBar` mit „Zurück zur Planung“ (öffnet Aufgabe und Planung wieder mit derselben Verteilung, `useTaskEditor.openEdit(task, resumePlan)`). Der Planungsdialog hat feste Höhe wie die Erstellen-Dialoge, die Blockliste scrollt.
- `planTask` plant in 15-Minuten-Schritten Blöcke von mindestens 30 Minuten im Planungsfenster vor der Fälligkeit, ohne Überschneidung mit belegter Zeit. Zu bestehenden Terminen hält es 5 Minuten Puffer (`PLAN_BUFFER_MINUTES`); Blöcke beginnen dann z. B. um 10:05 und enden auf einem 15-Minuten-Schritt. Direkt an einen Termin geht ein Block nur, wenn sonst Aufwand fehlen würde: Erst füllt ein zweiter Durchgang ohne Puffer den Rest auf, reicht das nicht, gewinnt eine Planung ganz ohne Puffer, wenn sie mehr unterbringt. Für Arbeit (`work` oder `taskId` in eigenen Kalendern, plus die neuen Blöcke) prüft es Ruhezeit zu anderen Tagen, Tages- und Wochenhöchstzeit, längste Strecke ohne Pause und die nötigen Pausen (Lücken ab 15 Minuten). Ruhetage des Landes, Feiertage und ganztägige Termine mit fester Kategorie bleiben frei. `even` verteilt den Rest gleichmäßig auf die übrigen Tage und füllt danach von vorn auf, `early` füllt von vorn, `late` füllt von der Fälligkeit rückwärts (Tage rückwärts, im Tag der späteste mögliche Block); ohne Fälligkeit plant `late` wie `early`. Passt nicht alles, liefert es `missingMinutes`; `findEarliestCompletion` sucht den Tag, an dem alles passt (für „Fälligkeit verschieben“).
- Regeln je Land in `utils/workingTimeLaw.ts` (`WORKING_TIME_LAWS`, sonst `DEFAULT_WORKING_TIME_LAW` mit den deutschen Werten). Das Land kommt aus `planningCountry` oder der Feiertagsregion bzw. Sprache (`usePlanningCountry`). Einstellungen im Tab **Planung** (`TaskPlanningSettings`): Verteilung, Land mit Übersicht der Regeln, Planungsfenster (mindestens eine Stunde, `isPlanningWindow`).
- Erledigt oder gelöscht: das Backend verschiebt künftige Blöcke in den Papierkorb und löst beim Löschen die übrigen. Lokal macht das `LocalTaskRepository` über `releaseTaskBlocks` des `LocalEventRepository`.

## Steuerung durch den Gastgeber

- `HostBridge` (`context/HostBridge.ts`) verbindet die Hülle (`CalendarWidget`) mit der gerade sichtbaren `Calendar`-Komponente. `useHostController` meldet dort den Controller an und berichtet Ansichtswechsel.
- Nach außen gibt es `CalendarHandle` (`lib/handle.ts`): als `ref` der React-Komponente und als Methoden am Custom Element. Die Methoden prüfen ihre Argumente und antworten mit `false`, solange kein Kalender angezeigt wird.

## Aussehen anpassen

- Öffentliche CSS-Variablen `--calendar-accent`, `--calendar-on-accent`, `--calendar-font`, `--calendar-radius`, `--calendar-bg`, `--calendar-surface`, `--calendar-text`, `--calendar-heading`, `--calendar-muted`, `--calendar-border`. Sie werden in `variables.css` in die internen Variablen übernommen. Die internen Variablen stehen dafür auch auf `.calendarRoot`, damit dort gesetzte Werte greifen.
- Akzentfarbe (`--color-accent`) und die Terminfarbe Blau (`--color-blue`) sind getrennt. Text auf der Akzentfarbe nutzt `--color-on-brand`, Text auf Terminfarben `--event-text`.
- Die Option `appearance` setzt dieselben Variablen als Inline-Stil auf `.calendarRoot` (`lib/appearance.ts`) und für `density: compact` das Attribut `data-compact`.

## Duplizieren und Rückgängig

- **Duplizieren** im Termin-Dialog öffnet einen neuen Termin mit den aktuellen Werten des Dialogs, auch noch nicht gespeicherten. Die Kopie bekommt eine neue `uid`, verliert die Verknüpfung zu einer Serie, und alle Teilnehmer stehen wieder auf „keine Antwort“. Angelegt wird sie erst beim Speichern, im Kalender aus dem Feld **Kalender**.
- **Kalender wählen und verschieben:** Das Feld **Kalender** im Dialog bietet die eigenen Kalender mit Recht zum Anlegen und die beschreibbaren CalDAV-Kalender an (`calendarChoices` aus `CalendarPage`). Bei bestehenden Terminen erscheint es nur für Serien und Einzeltermine, die man löschen darf (`canMoveEvent`); herausgelöste Termine wandern mit ihrer Serie. Beim Speichern wird erst die Änderung gespeichert und dann verschoben (`useEvents.moveEvent`, `POST /events/{eventId}/move`), mit Rückgängig. Kategorien entfallen, weil sie zum alten Kalender gehören. Zwischen Kalender und CalDAV verschiebt `withCaldavEvents` durch Anlegen im Ziel und Löschen des Originals.
- **Löschen** fragt nur noch bei Serien nach (welche Termine). Einzeltermine werden sofort gelöscht.
- Nach dem Löschen und nach dem Verschieben oder Ändern der Dauer per Ziehen erscheint unten für acht Sekunden ein Hinweis mit **Rückgängig**. `features/events/utils/undo.ts` zeichnet dafür jede Änderung am Speicher auf (anlegen, ändern, löschen, mit dem Stand davor) und nimmt sie rückwärts zurück. Gelöschte Termine werden neu angelegt. Verweisen herausgelöste Termine auf eine wiederhergestellte Serie, wird die neue ID eingesetzt. Ist ein vorheriger Stand nicht bekannt, gibt es kein Rückgängig.

## Design

- Farben und Layout basieren auf dem ursprünglichen Kalender-Design
- **Hell- und Dunkelmodus**, standardmäßig nach Systemeinstellung
- Manuell umschaltbar über `document.documentElement.dataset.theme = 'dark' | 'light'`. Einen Schalter in der Oberfläche gibt es noch nicht.
- Die Farben beider Modi stehen nur einmal in `variables.css` (CSS-Funktion `light-dark()`, unterstützt von allen aktuellen Browsern)
- Auf kleinen Bildschirmen lässt sich das Raster seitlich scrollen

---

[← Zurück](07-sign-in.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](09-data-storage.md)
