# Design Best Practices

Guidelines for implementing UI and maintaining visual consistency in the 3Beeez Next.js site. This project uses a custom CSS design token system — do not introduce Tailwind or inline styles.

## Design Token System

All visual values come from CSS custom properties in `app/globals.css`. Always use tokens — never hardcode colors, radii, or spacing.

### Color tokens
```
--bg: #07111f          Background (page)
--bg-alt: #0d1a2e      Background (alternate / card base)
--panel: rgba(10,23,43,0.72)  Panel / glass surface
--line: rgba(179,206,255,0.16) Border / divider
--text: #f5f8ff        Primary text
--muted: #a9b9d6       Secondary / muted text
--accent: #5ae0d2      Primary accent (teal)
--accent-strong: #0db6b6  Accent hover / emphasis
--accent-warm: #ffbf69  Warm accent (amber highlights)
```

### Shape & layout tokens
```
--radius-xl: 32px    Large cards, modals
--radius-lg: 24px    Medium cards, panels
--radius-md: 18px    Buttons, inputs, small cards
--max-width: 1220px  Page content max-width
--shadow: 0 28px 80px rgba(0,0,0,0.28)
```

### Typography
- `--font-sans`: "Plus Jakarta Sans" — body text, UI labels
- `--font-display`: "Space Grotesk" — headings, hero text
- Fonts are loaded via Google Fonts in `<head>`; do not use `next/font` unless migrating fully
- Type scale: use `rem` units; base is 16px. Suggested scale: 0.75 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 2 / 3rem

## Component Patterns

### Glass / panel surfaces
```css
background: var(--panel);
border: 1px solid var(--line);
border-radius: var(--radius-lg);
backdrop-filter: blur(12px);
box-shadow: var(--shadow);
```

### Buttons
- Primary: `background: var(--accent)`, `color: #07111f` (dark text on light accent), `border-radius: var(--radius-md)`
- Secondary/ghost: `border: 1px solid var(--line)`, `color: var(--text)`, transparent background
- Hover: transition accent to `--accent-strong`, subtle scale (`transform: scale(1.02)`)
- Always `cursor: pointer` and min touch target 44×44px

### Interactive states
- Hover: 150ms ease transition on color/background
- Focus: visible ring using `--accent` color (not browser default where overridden)
- Active: subtle scale down (`transform: scale(0.98)`)
- Disabled: `opacity: 0.45`, `cursor: not-allowed`

### Spacing rhythm
- Use multiples of 4px (0.25rem): 4, 8, 12, 16, 24, 32, 48, 64, 80, 96px
- Prefer padding/margin shorthand — be consistent within a component

## Layout

- Page wrapper: `max-width: var(--max-width); margin: 0 auto; padding: 0 24px`
- Section vertical rhythm: `padding: 80px 0` for major sections, `48px 0` for sub-sections
- Grid: use CSS Grid for two-dimensional layouts; Flexbox for one-dimensional
- Mobile-first breakpoints (suggested): 480px / 768px / 1024px / 1280px

## Visual Hierarchy

- One `<h1>` per page — large display font, prominent position
- CTAs (call-to-action) should be the highest contrast interactive element on the page
- Group related content visually (proximity) before reaching for borders/dividers
- Use whitespace generously — the dark background theme benefits from breathing room

## Animation & Motion

- Use `prefers-reduced-motion` media query — wrap all decorative animations:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
  ```
- Decorative: subtle, ≤ 300ms, `ease` or `ease-out`
- Loading states: skeleton screens preferred over spinners for content areas
- Avoid parallax, auto-playing video, or flashing content

## Figma Handoff Notes

When implementing from Figma designs:
- Map Figma color styles to the nearest `--token` above; flag mismatches rather than hardcoding
- Figma `border-radius` → use the closest token value; exact pixel values from Figma take precedence only if token doesn't fit
- Figma auto-layout padding/gap → convert to rem; round to nearest 4px multiple
- Extract icons as SVG; inline small icons, use `next/image` for larger illustration assets

## What NOT to do

- No inline `style={{ color: '#5ae0d2' }}` — use a CSS class with the token
- No Tailwind utility classes — this project uses semantic CSS
- No `!important` except inside `prefers-reduced-motion` blocks
- No hardcoded `px` font sizes — use `rem`
- No `z-index` values above 1000 except for modals/toasts (use a z-index scale: 10/20/50/100/200/1000)
