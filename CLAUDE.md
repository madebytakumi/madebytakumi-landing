# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`madebytakumi` is a single-page, bilingual (ES/EN) marketing landing site built with Astro and output as a fully static site. There is no backend — the contact form composes a WhatsApp deep link (`wa.me`) in the browser rather than posting anywhere.

## Commands

```bash
npm install
npm run dev      # local dev server (astro dev)
npm run check    # type-check (astro check) — run before build/commit
npm run build    # production build to dist/ (astro build)
npm run preview  # serve the built dist/ locally
```

There are no tests, linter, or formatter configured. `npm run build` does **not**
type-check — run `npm run check` for that. `check` is also what enforces ES/EN
i18n dictionary parity (see below): a missing/extra/mistyped key in `en.ts`
becomes a type error there. The inline browser script in `BaseLayout.astro` is
`// @ts-nocheck` (intentionally untyped DOM JS), so it does not participate.

## Architecture

### The i18n system is the thing to understand first

Content lives as two parallel typed dictionaries: `src/i18n/es.ts` and `src/i18n/en.ts`, aggregated in `src/i18n/index.ts` (`languages`, `defaultLang = "es"`). Both objects **must have identical shape** — the runtime looks up copy by dotted key path against whichever language is active, so a key missing from one language silently breaks that string.

This parity is enforced at compile time: `es.ts` is the source of truth (`as const`) and exports `type Dictionary = Widen<typeof es>` (a helper that widens the `as const` literals to their primitive shape). `en.ts` is annotated `export const en: Dictionary = {...}`, so a missing, extra, or wrongly-typed key in `en` is a `astro check` error. It does **not** catch a typo in a template `data-i18n="..."` string (those are opaque strings).

Rendering is a two-phase model:

1. **Build time (SSG):** every `.astro` component imports `es` directly and renders Spanish as the default/SEO content. Each translatable node is tagged with a `data-i18n="dotted.key.path"` attribute (variants: `data-i18n-aria`, `data-i18n-placeholder`).
2. **Runtime (client):** the inline `<script>` in `src/layouts/BaseLayout.astro` runs `applyLanguage(lang)`, which walks every `[data-i18n*]` node and overwrites its text/attribute from the `languages` dictionary. Language is persisted in `localStorage` under `takumi-lang` and toggled by `[data-lang-toggle]` (the `LanguageSwitcher` component).

**Consequence for editing:** to add or change any visible copy you must (a) add the key to *both* `es.ts` and `en.ts`, (b) render it in the `.astro` template with the matching `data-i18n` attribute. Hardcoding text in a template without a `data-i18n` key means it won't translate.

### Page composition

`src/pages/index.astro` is the only route. It wraps section components (`src/sections/*.astro` — Hero, Services, Projects, Process, CTA, Footer) in `src/layouts/BaseLayout.astro`. Reusable UI primitives are in `src/components/`. `src/data/projects.ts` just re-reads project items out of the i18n dictionary.

### Client behavior all lives in BaseLayout.astro

That single inline script owns everything interactive: language switching, scroll-driven header state, the mobile menu, back-to-top button, scroll-reveal animations (`.reveal` via `motion`'s `inView`), the custom accessible `<select>` widgets (`[data-custom-select]`), and the WhatsApp contact form. Animation uses the `motion` package; icons come from `@lucide/astro`.

### The contact form → WhatsApp flow

The CTA form (`[data-whatsapp-form]` in `src/sections/CTA.astro`) has `novalidate` and is validated entirely by hand in the BaseLayout script. On submit it builds a message string from the field values and localized labels, then opens `https://wa.me/<number>?text=<encoded message>` — no network request, no form backend. Validation error messages are themselves i18n keys under `cta.errors.*`.

### Styling

Tailwind CSS with semantic color tokens (`background`, `foreground`, `accent`, `muted`, `surface`, `line`) that map to CSS variables defined in `src/styles/variables.css`. Global styles and the decorative `.site-atmosphere` layers live in `src/styles/global.css`. The `Outfit` font is loaded from Google Fonts in the layout `<head>`.

### Conventions

- Import alias `@/*` → `src/*` (see `tsconfig.json`, extends `astro/tsconfigs/strict`).
- Environment variables: only `PUBLIC_*` vars are exposed to the client. `PUBLIC_CONTACT_EMAIL` and `PUBLIC_WHATSAPP_NUMBER` (digits only, international format) are read in `CTA.astro`; defaults live there. Local values are in `.env.development`.
- Output is `static` with `@astrojs/sitemap`; `site` is set to `https://madebytakumi.com` in `astro.config.mjs` (used for canonical URLs and the sitemap).
