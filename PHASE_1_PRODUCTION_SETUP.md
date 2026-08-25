# Phase 1: production configuration

The repository contains the deployable Firebase configuration and safe default
security rules. Complete the account-specific steps below before launch.

## 1. Create and connect Firebase

1. Create separate Firebase projects for staging and production.
2. In Firebase Authentication, enable Email/Password and Google providers.
3. Add the staging and production domains under Authentication > Settings >
   Authorized domains.
4. Create Firestore in production mode and enable Firebase Storage.
5. Register a Web app and copy its configuration values into `.env.local`.
6. Restrict the Firebase browser API key in Google Cloud Console to the final
   HTTPS domains and only the Firebase APIs used by this application.

Never commit `.env.local`. The public Firebase configuration identifies the
project; Firestore/Storage rules and server authorization provide data security.

## 2. Validate the environment

```bash
Copy-Item .env.local.example .env.local
npm run check:launch
```

Set the same variables in the hosting provider. Analytics IDs are optional, and
analytics remains consent-gated by the application.

## 3. Deploy Firebase rules

Install and authenticate the Firebase CLI, then select the intended project
carefully:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

The included rules intentionally prevent browser clients from creating or
changing orders, payments, inventory, and audit records. Those operations remain
locked until Phase 2 provides trusted server endpoints.

Staff access uses Firebase custom claims:

- `staff: true` permits operational catalog and moderation work.
- `admin: true` permits destructive administration.

Only a trusted server or administrator script using the Firebase Admin SDK may
assign these claims. Never let a browser client assign roles.

## 4. Configure the production domain

1. Add the custom domain at the hosting provider.
2. Verify DNS and HTTPS issuance.
3. Set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS origin.
4. Add that domain to Firebase Authentication authorized domains and API-key
   restrictions.
5. Run `npm run check:launch` and `npm run build` in the deployment environment.

## 5. Email and analytics

Customize Firebase Authentication email templates for verification and password
reset. Configure a branded sender domain where supported. Before transactional
email is added in Phase 2, choose a provider and prepare SPF, DKIM, and DMARC.

For analytics, set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and/or
`NEXT_PUBLIC_CLARITY_ID`. Confirm analytics does not start before consent and
that heatmaps remain disabled on checkout, profile, and admin routes.

## Phase 1 acceptance checklist

- `npm run check:launch` passes with production values.
- Firebase sign-up, verification, login, Google login, reset, and logout work.
- Firestore and Storage rules are deployed to the correct project.
- An unauthenticated rules test cannot read private customer data.
- A customer cannot read another customer's documents or uploads.
- A browser client cannot write orders, payments, inventory, or audit logs.
- Staff claims are assigned only through a trusted administrator process.
- Production DNS, HTTPS, Firebase authorized domains, and API restrictions match.
