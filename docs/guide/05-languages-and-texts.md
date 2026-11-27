# 5. Languages and texts

English, German, French, Spanish, Italian, Dutch, Polish and Portuguese are built in. Which language is used, in this order:

1. The user's choice in the settings.
2. Your `locale`.
3. The browser's languages.
4. `en-US`.

Formats follow the region, not the language: `en-US` starts the week on Sunday and shows `1:00 PM`, `en-GB` starts on Monday and shows `13:00`. A language that is not available falls back to English with the user's region.

**Own texts and languages.** `messages` overrides single texts or adds a language. Missing texts fall back to the built-in language, or to English for a new one. The full list of keys is the `Messages` type.

```js
document.querySelector('calendar-widget').messages = {
  de: { calendar: { newEvent: 'Neuer Eintrag' } },
  sv: { calendar: { today: 'Idag', newEvent: 'Ny händelse' }, views: { weekNumber: (week) => `V. ${week}` } },
}
```

Texts with values in them are functions, like `weekNumber` above. An override of the wrong kind (a text where a function is expected, or the other way round) is ignored.

---

[← Previous](04-configuration-file.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](06-reacting-to-changes.md)
