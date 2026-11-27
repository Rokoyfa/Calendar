# 19. Trash

Deleted events are not gone at once. They stay in the trash of their calendar for 30 days.

- **Where.** In the calendar settings, in the **Trash** tab (team and personal calendars). Each entry shows when and by whom it was deleted and when it will be gone for good. The list shows 20 entries at a time with **Show more**, and from 8 entries on a search by title, place or who deleted it.
- **Restore.** Brings the event back with the same id, so attachments, chat and email links work again. A series comes back with the detached events deleted together with it. A detached event can only come back while its series exists.
- **Delete for good.** Removes the event with attachments and chat at once, after a confirmation.
- **Empty the trash.** Deletes every entry the user may delete for good, after a confirmation that says how many. With only `delete_own_entry`, entries of others stay.
- **Undo.** The undo notice after deleting uses the trash too, so nothing is lost on the way back.
- **Who.** Everyone who may delete an event may restore it or delete it for good: with `delete_any_entry` every event, with `delete_own_entry` their own.
- **Local mode.** Without a backend the trash lives in the browser (`localStorage`) and works the same way.
- **Own adapter.** Implement `events.listTrash`, `events.restore` and `events.purge`, and optionally `events.emptyTrash` for the **Empty trash** button. Without them there is no trash and undo creates a copy of the deleted event. The same happens when `restore` answers `404`, `405` or `501`.

Turn the trash off with `features: { trash: false }`. Undo still restores from the trash when the backend has one.

---

[← Previous](18-live-updates.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](20-data-export.md)
