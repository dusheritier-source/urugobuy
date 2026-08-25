# Phase 2: secure backend

Phase 2 moves trusted commerce decisions into authenticated Next.js server APIs
backed by the Firebase Admin SDK and Firestore.

## Server environment

Configure the three `FIREBASE_ADMIN_*` variables from a dedicated Firebase
service account. They are server-only and must never use the `NEXT_PUBLIC_`
prefix. Grant the service account only the permissions required by the deployed
application and rotate keys according to your operations policy.

## API authorization

Firebase ID tokens are passed as `Authorization: Bearer <token>` and verified on
the server with revocation checking. Staff routes require `staff: true` or
`admin: true`; destructive product administration requires `admin: true`.

The client exchanges an ID token for an HTTP-only, secure, SameSite session
cookie. The server-rendered `/admin` layout verifies that cookie and its role
claims before any administration page renders.

Assign a role from a trusted workstation:

```bash
npm run admin:set-role -- manager@example.com staff
npm run admin:set-role -- owner@example.com admin
```

Role assignment is an administrative mutation. Confirm the email and selected
Firebase project before running it. Users must refresh their token or sign in
again after a role changes.

## Implemented APIs

- `POST/DELETE /api/auth/session`
- `GET/POST /api/products`
- `GET/PATCH/DELETE /api/products/:id`
- `GET/PUT /api/profile`
- `GET/POST /api/orders`
- `GET/PATCH /api/orders/:id`
- `GET/POST /api/reviews`
- `PATCH /api/reviews/:id`
- `GET/POST /api/promotions`
- `PATCH/DELETE /api/promotions/:id`
- `POST /api/promotions/validate`

All writes validate payloads with Zod. Authentication, authorization, safe error
responses, no-store customer responses, and process-level burst limiting are
centralized under `lib/server`.

## Order guarantees

Production checkout requires authentication. The order API:

1. Verifies the Firebase ID token.
2. Validates the request and idempotency UUID.
3. Loads product prices from Firestore rather than trusting the browser.
4. Validates and decrements stock in a single Firestore transaction.
5. Revalidates and redeems promotions transactionally.
6. Recalculates discount, shipping, tax, and total on the server.
7. Creates at most one order for each customer/idempotency-key pair.

Only cash on delivery is accepted during Phase 2. Card and Mobile Money stay
disabled in production until Phase 3 verifies provider webhooks. Demo mode keeps
the previous local checkout when Firebase is not configured.

## Deployment requirements

Deploy `firestore.indexes.json` with the Phase 1 rules. Configure distributed
rate limiting at the hosting edge; the included limiter is deliberately a
per-instance safety net and is not a replacement for a shared production limit.

Before accepting production orders, import the canonical product catalog into
Firestore using staff-authenticated product APIs, ensure every sellable product
has `status: "published"`, and test checkout against the Firebase emulator or a
dedicated staging project.
