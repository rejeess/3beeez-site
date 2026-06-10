# Accessibility Review & Implementation (WCAG 2.1 AA / ADA)

Review or implement accessibility best practices for the 3Beeez Next.js site. Target: WCAG 2.1 Level AA, sufficient for ADA compliance in a commercial web context.

## Semantic HTML

- Use semantic elements: `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`, `<article>`, `<aside>`
- `<main>` must appear exactly once per page and contain primary content
- `<nav>` elements must have an `aria-label` when more than one nav exists on a page (e.g. `aria-label="Main navigation"` vs `aria-label="Portal navigation"`)
- Buttons that trigger actions → `<button>`. Links that navigate → `<a href>`. Never use `<div onClick>` for interactive elements.

## Keyboard Navigation

- All interactive elements reachable and operable via keyboard (Tab, Enter, Space, Arrow keys)
- Visible focus indicator on every focusable element — never `outline: none` without a custom replacement
- Modal/dialog: trap focus inside while open, restore focus to trigger on close
- Skip-to-content link: first focusable element on every page should be `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>`
- Chat widget iframe: must have `title` attribute (e.g. `title="3Beeez chat widget"`)

## ARIA

- Use ARIA only when semantic HTML is insufficient — don't add `role="button"` to a `<button>`
- `aria-label` on icon-only buttons (e.g. close button with only an × character)
- `aria-expanded` on toggles (mobile nav, accordions, dropdowns)
- `aria-live="polite"` on dynamically updated regions (chat messages, form submission status, loading states)
- `aria-disabled` instead of the `disabled` attribute when you need the element to remain in tab order
- Form inputs: always paired with `<label htmlFor>` or `aria-label`; never use `placeholder` as the only label

## Color & Contrast

- Text contrast ratio: ≥ 4.5:1 for normal text, ≥ 3:1 for large text (≥ 18pt or 14pt bold)
- Current brand tokens to verify:
  - `--text: #f5f8ff` on `--bg: #07111f` → check passes (high contrast dark theme)
  - `--muted: #a9b9d6` on dark backgrounds → verify ≥ 4.5:1
  - `--accent: #5ae0d2` used as text color → verify contrast ratio
- Do not rely on color alone to convey meaning (e.g. error states need icon or text, not just red)
- Focus indicators must meet 3:1 contrast ratio against adjacent colors

## Forms

- Every `<input>`, `<select>`, `<textarea>` has an associated `<label>`
- Error messages associated with inputs via `aria-describedby`
- Required fields marked with `aria-required="true"` (and visually indicated)
- `autocomplete` attributes set appropriately (e.g. `autocomplete="email"`, `autocomplete="current-password"`)
- Don't clear form fields on error — preserve user input

## Images & Media

- All `<img>` / `next/image`: meaningful images have descriptive `alt`; decorative images have `alt=""`
- SVG icons used as UI elements need `aria-hidden="true"` if decorative, or `role="img" aria-label="..."` if meaningful

## Chat Widget Specific

- Chat messages container: `role="log"` + `aria-live="polite"` + `aria-label="Chat messages"`
- Send button: `aria-label="Send message"` when label is icon-only
- Input: `aria-label="Type your message"` or visible label
- Loading/typing indicator: `aria-live="polite"` region

## Testing

- Automated: install `axe-core` or use browser extension (axe DevTools, WAVE) — catches ~30% of issues
- Manual keyboard test: navigate entire page without mouse
- Screen reader test: VoiceOver (Mac) or NVDA (Windows) — verify chat widget is fully operable
- Contrast checker: use browser DevTools accessibility panel or WebAIM Contrast Checker

## Quick audit command

```bash
# Find images missing alt attributes
grep -rn '<img' app/ components/ --include="*.tsx" | grep -v 'alt='

# Find onClick on non-interactive elements
grep -rn 'onClick' app/ components/ --include="*.tsx" | grep -v '<button\|<a \|<input\|<select\|<textarea\|<form'
```
