# TODO: Fix Dark Mode

## Info gathered
- ThemeProvider is configured in `components/providers.tsx` with `attribute="class"`.
- `ThemeToggle` toggles `theme` between `dark` and `light` via `next-themes`.
- `app/layout.tsx` hard-codes body background and text classes (`bg-[#fffaf4] text-stone-900`), preventing dark styles from taking effect.
- `app/globals.css` defines `:root` CSS variables but does not define `.dark` overrides.

## Plan
1. Update `app/layout.tsx` to stop hard-coding light-only Tailwind classes.
2. Add `.dark` overrides in `app/globals.css` for `--background` and `--foreground` (and thus body colors).
3. Ensure Tailwind has `darkMode: "class"` in config (if missing).
4. Verify `ThemeToggle` works by ensuring `next-themes` applies a `dark` class to the correct element.

## Followup steps
- Run `npm run dev` and manually toggle theme, checking body background, navbar, and main content.

