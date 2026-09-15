# Infinity Services Marketing Site — Design Spec

Date: 2026-09-14

## Purpose

A public marketing website for Infinity Services MN. It:

1. Pitches Infinity Services as a custom software shop available for hire by
   Minnesota businesses.
2. Showcases InfiniHerd and InfiniTrack as flagship products built under the
   Infinity Services umbrella, linking out to the live apps.
3. Gives prospective clients a way to get in touch.

This is a new, standalone project — it does not share a runtime or database
with InfiniHerd or InfiniTrack, only visual language and hosting conventions.

## Stack

- **Angular 20**, standalone components, TypeScript strict mode — same major
  version as InfiniHerd and InfiniTrack for consistency across the three
  Infinity Services codebases.
- **Plain SCSS**, no Angular Material. A marketing site is mostly bespoke
  layout (hero sections, cards, CTAs) rather than data-dense UI, so Material's
  form/table/dialog machinery isn't needed and would add bundle weight for no
  benefit.
- **Light mode only.** No dark-mode toggle. InfiniHerd/InfiniTrack are
  dashboards used repeatedly by logged-in operators, where a dark mode earns
  its keep; a marketing site is read once per visitor and doesn't need the
  added complexity.
- **Angular Router**, lazy-loaded standalone route components.
- **Deployment**: Vercel, `framework: angular`, matching the
  `vercel.json` pattern used by InfiniHerd (`buildCommand: npm run build`,
  SPA rewrite to `index.html`, immutable caching on static assets). Target
  domain: infinityservicesmn.com (DNS/domain setup happens outside this spec).

## Visual direction

Carries forward the palette and type already established by InfiniHerd and
InfiniTrack's Angular Material theme (`mat.$azure-palette` + `mat.$yellow-palette`,
Inter font), translated into a marketing register — bigger type, more
whitespace, bold hero sections instead of dense dashboard chrome.

Chosen direction — **Option B, "Light & Approachable"** (selected via visual
mockup comparison during brainstorming):

- Background: white / slate-50 (`--color-slate-50: #f8fafc`)
- Headline text: near-black slate (`--color-slate-900: #0f172a`), with an
  azure-blue accent word/phrase per headline (`#1565c0`)
- Primary CTA button: azure-to-navy gradient (`#1565c0` → `#05306C`)
- Secondary CTA button: white with slate border
- Product chips (InfiniHerd / InfiniTrack callouts): light blue background
  (`#dbeafe`) with navy text (`#05306C`)
- Font: Inter (300–700 weights), same Google Fonts import as the sibling apps
- Border radius / shadow scale: reuse the sibling apps' `--radius-sm/md/lg/xl`
  and `--shadow-sm/md/lg` tokens

Logo: text-based wordmark for v1 (e.g. a colored dot/mark + "INFINITY
SERVICES" in Inter, as shown in the mockup) — no image asset exists yet, can
be swapped for real branding later without restructuring the nav component.

## Site map / pages

All routes lazy-loaded standalone components under a shared app shell
(`NavbarComponent` + `<router-outlet>` + `FooterComponent`).

1. **Home (`/`)**
   - Hero: headline, sub-pitch, primary CTA ("Start a Project") + secondary
     CTA ("See Our Work"), InfiniHerd/InfiniTrack chips
   - Services teaser: 3 short service highlights, links to `/services`
   - Products teaser: InfiniHerd + InfiniTrack cards, links to `/products`
   - Closing CTA band linking to `/contact`

2. **Services (`/services`)**
   - Cards describing custom software development offerings. Placeholder
     copy for v1 (custom web apps, third-party integrations, workflow
     automation) — content owner can revise later.

3. **Products (`/products`)**
   - Full-detail cards for InfiniHerd and InfiniTrack: description drawn from
     each app's own README/package.json description, feature bullets, and an
     outbound link to the live app. Exact production URLs are a content
     placeholder (`TODO` comment in the component) since neither app's
     `vercel.json` pins a custom domain — fill in once confirmed.

4. **About (`/about`)**
   - Short company/founder pitch section. Placeholder copy for v1.

5. **Contact (`/contact`)**
   - Name / email / message form.

## Contact form — data flow

```
[ContactComponent form] --POST--> [/api/contact (Vercel Node function)]
                                        |
                                        v
                              validate name/email/message
                                        |
                                        v
                          send via email provider API
                                        |
                    success -----------------------  failure
                       |                                |
                       v                                v
           inline success message,             inline error message,
           form resets                         form values preserved
```

- `/api/contact` is a Vercel serverless function (Node runtime), not part of
  the Angular app bundle — same pattern as InfiniTrack's `api/` directory.
- Server-side validation: non-empty name, valid email shape, non-empty
  message, basic length caps to block abuse. Reject with 400 + inline error
  copy on failure.
- The actual email-sending provider is **not chosen in this spec**. Per this
  project's process for adding any external service, the `marketplace`
  skill's `discover` step runs first during implementation to pick and
  provision a real provider (e.g. Resend) rather than hardcoding one here.
- No database. Submissions are emailed directly; nothing is persisted for
  v1. (If a submissions log is wanted later, that's a follow-up, not part of
  this spec.)

## Error handling

- Contact form: client-side required-field checks before submit; server-side
  re-validation (never trust the client alone); network/API failures surface
  as an inline banner with the entered values retained so nothing is lost.
- Route-level: unmatched paths redirect to `/` (no dedicated 404 page for v1
  — small enough site that this is acceptable).

## Testing

- Karma/Jasmine unit tests per component (nav, footer, hero, each page
  shell, contact form validation logic) — same `npm test` / `npm run
  test:ci` convention as InfiniHerd/InfiniTrack.
- Unit tests for `/api/contact`'s validation logic (valid input passes,
  missing/malformed fields are rejected) run via the same test runner
  pattern InfiniTrack uses for its `api/` functions (`vitest`).
- No e2e test suite for v1 — the site is static content plus one form;
  manual verification in a browser covers it.

## Out of scope for v1

- CMS or blog
- Dark mode
- Analytics/tracking
- Submission persistence/database
- Case studies / portfolio detail pages beyond the Products page
- Dedicated 404 page

## Open items to confirm during implementation

- Exact production URLs for InfiniHerd and InfiniTrack to link out to from
  the Products page.
- Which email provider fulfills contact-form delivery (resolved via the
  `marketplace` skill, not pre-decided here).
- DNS/domain configuration for infinityservicesmn.com on Vercel.
