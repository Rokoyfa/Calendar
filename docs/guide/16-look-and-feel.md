# 16. Look and feel

The calendar follows light and dark mode by itself. On top of that you can match it to your page in two ways. Both set the same things, so use whichever is handier.

**From your CSS.** Custom properties set on the element reach into the calendar:

```css
calendar-widget {
  --calendar-accent: #e63946;
  --calendar-on-accent: #ffffff;
  --calendar-font: 'Inter', sans-serif;
  --calendar-radius: 6px;
}
```

With the React component, set them on the element you give a `className` or `style`.

| Property | Default | |
| --- | --- | --- |
| `--calendar-accent` | blue | Buttons, links, the active view, today, selection and focus ring |
| `--calendar-on-accent` | white, dark in dark mode | Text on the accent color. Set it when your accent is light (or dark in dark mode) |
| `--calendar-font` | Segoe UI, sans-serif | Font family. Your page has to load the font |
| `--calendar-radius` | `10px` | Corner radius of dialogs, buttons and fields. `0px` gives square corners |
| `--calendar-bg` | white / near black | Background |
| `--calendar-surface` | white / dark grey | Dialogs and cards |
| `--calendar-text` | near black / light grey | Text |
| `--calendar-heading` | grey | Headings |
| `--calendar-muted` | grey | Secondary text |
| `--calendar-border` | light grey / dark grey | Grid lines and borders |

Colors you set apply in light and dark mode alike. To give each its own value, use `light-dark()` or a media query in your CSS, or fix the mode with `theme`.

**As an option**, which also works in a configuration file:

```html
<calendar-widget accent-color="#e63946" font-family="Inter, sans-serif" radius="6" density="compact"></calendar-widget>
```

```tsx
<Calendar appearance={{ accentColor: '#e63946', fontFamily: 'Inter, sans-serif', radius: 6, density: 'compact' }} />
```

| Field | Attribute | |
| --- | --- | --- |
| `accentColor` | `accent-color` | A CSS color. For a hex color the text color on it is picked for you |
| `fontFamily` | `font-family` | A CSS font family |
| `radius` | `radius` | Corner radius in pixels, 0 to 24 |
| `density` | `density` | `comfortable` (default) or `compact` with smaller text, rows and spacing |

The option wins over the CSS properties. The colors of events are not affected by the accent color, they keep the color the user gave them.

---

[← Previous](15-controlling-the-calendar-from-your-page.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](17-attachments.md)
