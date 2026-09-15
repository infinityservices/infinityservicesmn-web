# Infinity Services Marketing Site

The public marketing website for Infinity Services MN — built with Angular 20.

## Running locally

```bash
npm install
npm start          # ng serve, http://localhost:4200
```

## Testing

```bash
npm run test:ci    # Angular component specs, single run for CI
npm test           # Angular component specs, watch mode
npm run test:api   # Vitest specs for the /api/contact function
```

## Contact form configuration

`/api/contact` sends email via Resend (see
`docs/superpowers/specs/2026-09-14-marketing-site-design.md` and
`docs/superpowers/plans/2026-09-14-marketing-site.md` Task 9 for how this
was provisioned). Required environment variables, set in the Vercel project:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` — inbox that receives submissions
- `CONTACT_FROM_EMAIL` — verified sending address

## Deployment

`vercel.json` builds this app (`framework: angular`,
`dist/infinity-services/browser`) and is what Vercel deploys to
production, at infinityservicesmn.com.

## Docs

- Design spec: `docs/superpowers/specs/2026-09-14-marketing-site-design.md`
- Implementation plan: `docs/superpowers/plans/2026-09-14-marketing-site.md`
