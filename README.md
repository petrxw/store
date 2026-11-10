# PirateVault store (stage 1)

Next.js 15, TypeScript, Tailwind, Supabase, Stripe, Resend. Change the brand name in `src/config/brand.ts` and colors in `tailwind.config.ts`.

## What works now
- Storefront: home, 4 category pages (search, filter, sort), product pages (gold theme for Golden A$AP Rocky), legal pages, SEO metadata, sitemap, robots.
- Cart: add, remove, change quantity, subtotal, drawer, saved between visits.
- Checkout: guest email, order summary, Stripe Checkout. Prices and stock are re-read from the database on the server.
- Delivery: payment confirmed only by a signature-verified webhook, amount checked against the order, codes reserved in one database transaction, delivery email sent once, codes encrypted at rest.
- Tested: 25 SQL checks (payment verification, allocation, no duplicate codes, rollback on low stock, row-level security), 6 encryption checks, production build, route and API status checks.

## Not built yet (stage 2)
Admin dashboard, coupons, newsletter, analytics pixels with a consent banner, abandoned-cart tracking, Open Graph images, order refund button. Until the admin exists, add codes with the script below and manage products in the Supabase table editor.

## Setup
1. `npm install`
2. Create a Supabase project. In the SQL editor run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill it in. Generate the encryption key with the command in that file.
4. `npm run dev` and open http://localhost:3000
5. Stripe: add a webhook endpoint `https://YOUR-DOMAIN/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` and `charge.refunded`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`. Locally use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
6. Add codes: `npm run load-codes -- v-bucks-1000 codes.txt` (one code per line).
7. Deploy to Vercel and set the same environment variables there.

## Before you take real money
- Seed prices and product text are placeholders. Replace them.
- Automated delivery is OFF. It runs only when `AUTO_DELIVERY_ENABLED=true` and the product has `delivery_verified = true`. Paid orders otherwise wait with status `awaiting_manual`.
- Every product needs a verified source and resale authorization for its codes.
- Your payment provider must approve this business. Stripe lists in-game currency, gift cards and virtual credits as restricted, so apply and get written approval first.
- Replace every [BRACKET] in `src/config/legal.ts` and have the policies reviewed.
- Set a real support email in `src/config/brand.ts`.
- Add Stripe Radar rules and watch chargebacks closely. Digital codes are a fraud target.
- If a customer pays and the last code sells out in between, the order is marked `failed` and needs a manual refund.

## Known items
- Unknown product URLs show the not-found page with `noindex` but return HTTP 200 on some hosts. Harmless for now, worth fixing in stage 2.
- Open bug: in a headless Chromium test of the production build, about 1 in 15 page loads logs React hydration error #418 on every page. It never appeared in dev mode, a bare Next app in the same browser was clean, and removing `globals.css` made it disappear. Pinning React to 19.1 and inlining CSS did not fix it. React recovers by re-rendering, so pages still work, but check it in a real browser after you deploy and tell me if you see it.
