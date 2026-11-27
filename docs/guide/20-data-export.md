# 20. Data export

Users can download their own data in the settings, in the **Data** tab, as required by Art. 20 GDPR (right to data portability).

- **Signed in.** The file comes from `GET /auth/me/export` on your backend. What belongs into it is listed in [Rules for the backend](10-backend.md#rules-for-the-backend). With your own `AuthRepository`, implement `exportData()`; without it the tab is not shown to signed-in users.
- **Local mode.** The file contains everything the calendar stores in this browser (`localStorage` keys starting with `calendar.`), with the format `calendar-browser-export`.
- **File.** JSON, named `calendar-export-YYYY-MM-DD.json`.

Turn it off with `features: { dataExport: false }`, for example when your page already offers its own export.

---

[← Previous](19-trash.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](21-accessibility.md)
