# Phase 5: fulfilment, returns, and email

This phase moves post-purchase operations to authenticated server APIs and a durable email queue.

## Included

- Staff order progression with enforced transitions: processing, shipped, and delivered
- Tracking numbers and immutable tracking events
- Provider-backed refunds and staff/customer cancellation rules
- Customer return requests within 30 days of delivery
- Staff approval, receipt, rejection, and resolution of returns
- Queued transactional messages for order creation, payment confirmation, fulfilment, returns, and back-in-stock alerts
- Signed Resend webhook handling, event deduplication, and bounce/complaint suppression

## Resend setup

1. Verify the sending domain in Resend and configure its DNS records.
2. Set `RESEND_API_KEY` and a verified sender in `EMAIL_FROM`.
3. Create a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/resend` and subscribe to delivery, bounce, complaint, and suppression events.
4. Put the signing secret in `RESEND_WEBHOOK_SECRET`.
5. Generate a long random `EMAIL_JOB_SECRET`.

## Running queued messages

Call `POST /api/internal/email-jobs` on a schedule, supplying either:

```
Authorization: Bearer YOUR_EMAIL_JOB_SECRET
```

or `x-job-secret`. Run it every minute in production. Each request claims a limited batch; Resend idempotency keys and Firestore job state prevent normal duplicate sends. Restrict this endpoint to the scheduler secret and never expose that secret to the browser.

## Operations

- Staff manage fulfilment from `/admin/orders`.
- Customers submit and review returns at `/returns`.
- Failed queue records remain in `notificationQueue` with their last error for inspection and retry.
- Suppressed recipients are stored as hashes in `emailSuppressions`; raw addresses are not used as document IDs.

Before launch, run `npm run check:launch`, `npm run typecheck`, and `npm run build`.
