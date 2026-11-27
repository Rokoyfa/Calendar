# 17. Attachments

Files can be attached to events, for example an agenda or a flyer.

- **Where.** In the event dialog under "Details", with a button or by dragging files onto the section. Events with attachments show a paperclip.
- **New events.** Files chosen while creating an event are uploaded right after it is saved. If one fails, the event is kept and a message names the files that are missing.
- **Limits.** Up to 20 files per event, each at most 10 MB. Empty and larger files are refused before anything is sent.
- **Who may do what.** Everyone who can see the event can download its files. Uploading and deleting needs the right to edit the event. In read-only mode files can only be downloaded.
- **Series.** A recurring event has one set of attachments for all its occurrences. An occurrence changed on its own gets its own set.
- **Not included.** Attachments are not copied when duplicating an event, and they are not part of `.ics` exports, subscription feeds or public links.
- **Local mode.** Without a backend there are no attachments, because browser storage is too small for files.

Turn the feature off with `features: { attachments: false }`.

---

[← Previous](16-look-and-feel.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](18-live-updates.md)
