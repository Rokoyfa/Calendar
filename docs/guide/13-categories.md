# 13. Categories

Every calendar can have its own categories, for example "Training" and "Match". Events get up to five of them, and a filter in the calendar menu shows only the chosen ones.

Besides them there are seven **fixed categories** that every calendar has and nobody can change: work, leisure, household, family, health, sport and learning (`builtinCategories`: `work`, `leisure`, `household`, `family`, `health`, `sport`, `learning`). Events and tasks can have any number of them, and they come first in the dialog and in the filter. The task planner uses them to tell work from other appointments (see [Tasks](29-tasks.md)). They are not part of `categoryIds`, do not count towards the limit of five and are kept when an event or task moves to another calendar. Your backend stores them per event and task and rejects unknown values (`400`).

- **Managing.** Categories are created, renamed and deleted in the calendar's settings, by members with `manage_calendars` and by the owner of a personal calendar. A calendar holds up to 30.
- **Assigning.** The event dialog shows the categories of the event's calendar as chips. Anyone who may edit the event may assign them. Whoever may manage the categories can also create a new one right there with "+ New category"; it is selected at once.
- **Filtering.** The filter button appears as soon as one of the shown calendars has categories. It also offers "Without category". The choice lasts until the page is reloaded.
- **Deleting.** A deleted category disappears from its events.
- **Local mode.** Categories work without a backend, stored in the browser.
- **Export and subscriptions.** Exported `.ics` files carry the category names as `CATEGORIES`, which Google Calendar, Outlook and Apple Calendar understand. Your subscription feed should do the same.
- **Import.** Categories in an imported file are matched to the calendar's categories by name, without regard to case. Missing ones are created if the importing member may manage the calendar and the limit of 30 is not reached, otherwise they are left out. When a known event is imported again from a file without categories, it keeps its own.

Turn the feature off with `features: { categories: false }`.

---

[← Previous](12-calendar-subscriptions.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](14-read-only-mode-and-public-links.md)
