# Urugo production launch checklist

## Required gates

- Run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run check:launch`.
- Configure the production Firebase project and restrict its API key by domain and API.
- Deploy Firestore and Storage deny-by-default rules with explicit customer and staff ownership checks.
- Replace browser-persisted commerce repositories with server-side transactional storage before accepting real payments.
- Configure a PCI-compliant payment provider, signed webhooks, persistent idempotency, refunds, and reconciliation.
- Configure the site URL, analytics IDs, DNS, HTTPS, and transactional-email SPF/DKIM/DMARC.
- Enforce staff roles on the server for every admin read and mutation. Hidden UI is not authorization.
- Configure edge rate limiting for authentication, checkout, coupons, reviews, returns, support, and webhooks.
- Run keyboard, screen-reader, contrast, responsive, checkout, refund, concurrent-stock, and browser acceptance tests.
- Test backup restoration, monitoring alerts, incident ownership, rollback, and provider test transactions.

## Privacy

- Verify analytics remains disabled until consent.
- Verify heatmaps never run on checkout, profile, or administration routes.
- Confirm retention periods and fulfil export/deletion requests across all production processors.
