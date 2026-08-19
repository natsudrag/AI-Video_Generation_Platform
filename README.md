# AI Video Generation Platform

MotionForge AI is a premium AI video and image generation platform with a
creator-facing studio, Stripe-powered credit packs, provider-routed generation
jobs, upload handling, and a customer credit ledger.

## Stack

- Vinext / Next app router
- React 19
- Custom cinematic CSS system
- Stripe Checkout for credit-pack purchases
- Server-side credit ledger, payment records, upload records, and generation jobs
- Provider adapter boundary for Vercel AI Gateway, Runway, Kling, OpenAI,
  Replicate, and Seedance
- Railway-ready runtime configuration

## Quick Start

```bash
npm install
npm run dev
npm run build
npm test
```

## Environment

Copy `.env.example` to `.env.local` for local development, then fill in the
values needed for the capability being tested.

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

AI_GATEWAY_API_KEY=
RUNWAY_API_KEY=
KLING_API_KEY=
OPENAI_API_KEY=
REPLICATE_API_TOKEN=
SEEDANCE_API_KEY=

MOTIONFORGE_STARTING_CREDITS=24
MOTIONFORGE_MOCK_GENERATION=false
MOTIONFORGE_DATA_DIR=.data
```

## Backend Flow

1. A visitor receives an anonymous `mf_customer` session cookie.
2. `/api/me` creates the account if needed and returns the current credit
   balance, ledger entries, and recent generation jobs.
3. `/api/stripe/checkout` creates a Stripe Checkout Session for a selected
   credit pack.
4. `/api/stripe/webhooks` verifies Stripe signatures and credits the customer
   ledger idempotently when checkout completes.
5. `/api/assets/upload` stores an image or video source and records ownership.
6. `/api/generations/quote` prices a job by model, mode, duration, and quality.
7. `/api/generations` validates the asset, provider readiness, and balance,
   reserves credits, creates a job, and dispatches through the provider adapter.

## Provider Integration

The provider adapter is intentionally env-driven. If a model provider key is
missing, generation returns a setup-required response and does not reserve
credits. Set `MOTIONFORGE_MOCK_GENERATION=true` to exercise the full UI and
ledger path before live vendor keys are available.

The next production step after vendor keys are available is replacing each
adapter placeholder with the provider-specific submit/status/result API calls
for the exact model endpoints selected.

## Important Files

- `app/studio-shell.tsx`: creator workspace UI wired to credits, upload,
  checkout, and generation APIs
- `app/lib/backend/catalog.ts`: credit packages, model catalog, and pricing math
- `app/lib/backend/store.ts`: customer, ledger, payment, asset, and job store
- `app/lib/backend/stripe.ts`: Stripe Checkout and webhook verification
- `app/lib/backend/providers.ts`: provider readiness and dispatch boundary
- `app/lib/backend/storage.ts`: local/Railway upload storage path
- `app/api/*`: public backend routes used by the studio
- `.env.example`: Stripe, provider, and runtime configuration template
