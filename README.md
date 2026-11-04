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

`/api/contact` sends email via [Resend](https://resend.com). **Before this goes live, complete this checklist:**

1. Create a Resend account and verify a sending domain.
2. In the Vercel project, set these environment variables:
   - `RESEND_API_KEY`
   - `CONTACT_TO_EMAIL` — inbox that receives submissions
   - `CONTACT_FROM_EMAIL` — verified sending address
3. Submit a live test through the deployed `/contact` page and confirm the email arrives.

### Saving leads to Supabase

Each submission is also saved to the `leads` table in the **Infinity Services Business** Supabase project (shared later by `/admin` and a client portal), for the upcoming `/admin` area. The schema lives in `supabase/migrations/`.

- `SUPABASE_URL` — the project's API URL
- `SUPABASE_SERVICE_ROLE_KEY` — the project's **secret** key (`sb_secret_...`, under Project Settings → API Keys); a legacy `service_role` key also works. Server-side only; never expose it to the browser

Email and the database save run side by side. The visitor sees success if either one works, so an outage in one never loses an inquiry. With neither email nor Supabase configured, `/api/contact` returns a 500.

## Business admin (`/admin`)

A private admin area for leads, clients, projects and billing, lazy-loaded so public visitors never download it. Data lives in the **Infinity Services Business** Supabase project; schema in `supabase/migrations/`.

**Access.** Only emails listed in `private.admin_users` can read or change anything (enforced by row-level security). To sign in:

1. In Supabase → Authentication → Users, **Add user** with your email and a password (auto-confirm).
2. If that email isn't `jeremy@infinityservicesmn.com`, add it: `insert into private.admin_users (email) values ('you@example.com');`
3. In Supabase → Authentication → Sign In / Providers, turn **off** "Allow new users to sign up".
4. Visit `/admin` and sign in.

**Billing sync.** Square and Stripe stay the source of truth; webhooks mirror status into the admin.

| Webhook | Endpoint | Events | Vercel env vars |
| --- | --- | --- | --- |
| Square | `/api/square-webhook` | `invoice.created`, `invoice.published`, `invoice.updated`, `invoice.payment_made`, `invoice.canceled`, `invoice.refunded`, `invoice.scheduled_charge_failed` | `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_WEBHOOK_URL` (exactly the URL entered in Square) |
| Stripe | `/api/stripe-webhook` | `customer.created`, `customer.updated`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` | `STRIPE_WEBHOOK_SECRET` |

- Square invoices attach to the client with the same Square customer ID, or else the one client with the same email (which then records the ID). Unmatched invoices show under Billing → "Not linked to a client".
- Stripe subscriptions are saved only for customers linked to a client, so InfiniTrack/InfiniHerd subscriptions on the same Stripe account are ignored. A new Stripe customer whose email matches a client is linked automatically; otherwise paste the `cus_…` ID on the client page.

## Deployment

`vercel.json` builds this app (`framework: angular`,
`dist/infinity-services/browser`) and is what Vercel deploys to
production, at infinityservicesmn.com.

## Docs

- Design spec: `docs/superpowers/specs/2026-09-14-marketing-site-design.md`
- Implementation plan: `docs/superpowers/plans/2026-09-14-marketing-site.md`
