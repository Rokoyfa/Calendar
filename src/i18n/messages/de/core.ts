import type { Messages } from '../types.ts'

export const common: Messages['common'] = {
  loading: 'Lädt …',
  close: 'Schließen',
  cancel: 'Abbrechen',
  save: 'Speichern',
  saving: 'Wird gespeichert …',
  saved: 'Gespeichert.',
  delete: 'Löschen',
  deleting: 'Wird gelöscht …',
  backToCalendar: 'Zum Kalender',
  backToSettings: 'Zu den Einstellungen',
  settings: 'Einstellungen',
  progress: 'Fortschritt',
  next: 'Weiter',
  back: 'Zurück',
}

export const errors: Messages['errors'] = {
  unknown: 'Ein unbekannter Fehler ist aufgetreten.',
  eventNotFound: 'Der Termin wurde nicht gefunden.',
  accountRequired: 'Team-Kalender gibt es nur mit Konto.',
  saveEventsFailed: 'Die Termine konnten nicht lokal gespeichert werden.',
  savePreferencesFailed: 'Die Einstellungen konnten nicht lokal gespeichert werden.',
  saveColorFailed: 'Die Farbe konnte nicht lokal gespeichert werden.',
  saveDecisionFailed: 'Die Entscheidung konnte nicht gespeichert werden.',
  invalidLink: 'Der Link ist ungültig oder abgelaufen.',
  invalidResetLink: 'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.',
  invalidCredentials: 'E-Mail-Adresse oder Passwort ist falsch.',
  emailTaken: 'Für diese E-Mail-Adresse gibt es bereits ein Konto.',
  wrongCurrentPassword: 'Das aktuelle Passwort ist falsch.',
  wrongPassword: 'Das Passwort ist falsch.',
  soleOwner: 'Du bist einziger Owner eines Teams mit weiteren Mitgliedern. Bitte übergib zuerst die Leitung.',
  status: {
    400: 'Die Anfrage war ungültig.',
    401: 'Bitte melde dich an.',
    403: 'Dafür fehlt dir die Berechtigung.',
    404: 'Der Eintrag wurde nicht gefunden.',
    409: 'Der Eintrag wurde inzwischen geändert. Bitte neu laden.',
    413: 'Die Daten sind zu groß.',
    422: 'Die Eingaben sind ungültig.',
    429: 'Zu viele Anfragen. Bitte kurz warten.',
  },
  serverError: 'Auf dem Server ist ein Fehler aufgetreten.',
  requestFailed: (status) => `Die Anfrage ist fehlgeschlagen (${status}).`,
  kind: {
    timeout: 'Der Server hat nicht rechtzeitig geantwortet.',
    network: 'Der Server ist nicht erreichbar.',
    aborted: 'Die Anfrage wurde abgebrochen.',
    parse: 'Die Antwort des Servers konnte nicht gelesen werden.',
  },
}

export const validation: Messages['validation'] = {
  emailRequired: 'Bitte eine E-Mail-Adresse eingeben.',
  emailInvalid: 'Bitte eine gültige E-Mail-Adresse eingeben.',
  integerRange: (min, max) => `Bitte eine ganze Zahl von ${min} bis ${max} eingeben.`,
  titleRequired: 'Bitte einen Titel eingeben.',
  titleTooLong: (max) => `Der Titel darf höchstens ${max} Zeichen lang sein.`,
  descriptionTooLong: (max) => `Die Beschreibung darf höchstens ${max} Zeichen lang sein.`,
  startDateInvalid: 'Bitte ein gültiges Startdatum wählen.',
  startTimeInvalid: 'Bitte eine gültige Startzeit wählen.',
  endDateInvalid: 'Bitte ein gültiges Enddatum wählen.',
  endTimeInvalid: 'Bitte eine gültige Endzeit wählen.',
  endDateBeforeStart: 'Das Enddatum darf nicht vor dem Startdatum liegen.',
  endBeforeStart: 'Das Ende muss nach dem Beginn liegen.',
  weekdaysRequired: 'Bitte mindestens einen Wochentag wählen.',
  dateInvalid: 'Bitte ein gültiges Datum wählen.',
  untilBeforeStart: 'Das Ende der Wiederholung darf nicht vor dem Startdatum liegen.',
}

export const colors: Messages['colors'] = {
  blue: 'Blau',
  red: 'Rot',
  green: 'Grün',
  yellow: 'Gelb',
}

export const themes: Messages['themes'] = {
  system: 'Wie System',
  light: 'Hell',
  dark: 'Dunkel',
}

export const recurrence: Messages['recurrence'] = {
  frequency: { daily: 'Täglich', weekly: 'Wöchentlich', monthly: 'Monatlich', yearly: 'Jährlich' },
  units: {
    daily: { one: 'Tag', many: 'Tage' },
    weekly: { one: 'Woche', many: 'Wochen' },
    monthly: { one: 'Monat', many: 'Monate' },
    yearly: { one: 'Jahr', many: 'Jahre' },
  },
  every: (interval, unit) => `Alle ${interval} ${unit}`,
  onWeekdays: (weekdays) => ` am ${weekdays}`,
  onDate: (date) => ` am ${date}`,
  monthlyOnDay: (day) => `am ${day}.`,
  monthlyOnWeekday: (ordinal, weekday) => `am ${['ersten', 'zweiten', 'dritten', 'vierten', 'fünften'][ordinal - 1]} ${weekday}`,
  monthlyOnLastWeekday: (weekday) => `am letzten ${weekday}`,
  until: (date) => ` bis ${date}`,
  times: (count) => (count === 1 ? ', einmal' : `, ${count}-mal`),
}
