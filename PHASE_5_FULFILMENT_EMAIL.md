# Phase 5: fulfilment, returns, and email

This phase moves post-purchase operations to authenticated server APIs and a durable email queue.

## Included

- Staff order progression with enforced transitions: processing, shipped, and delivered
- Tracking numbers and immutable tracking events
- Provider-backed refunds and staff/customer cancellation rules
- Customer return requests within 30 days of delivery
- Staff approval, receipt, rejection, and resolution of returns
- Queued transactional messages for order creation, payment confirmation, fulfilment, returns, back-in-stock, and price-drop alerts
- Welcome emails for new accounts and consent-based newsletters/campaigns for verified, opted-in customers
- Signed Resend webhook handling, event deduplication, and bounce/complaint suppression

## Resend setup

1. Verify the sending domain in Resend and configure its DNS records.
2. Set `RESEND_API_KEY` and a verified sender in `EMAIL_FROM`.
3. Create a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/resend` and subscribe to delivery, bounce, complaint, and suppression events.
4. Put the signing secret in `RESEND_WEBHOOK_SECRET`.
5. Generate a long random `EMAIL_JOB_SECRET`.
6. Set `BUSINESS_POSTAL_ADDRESS` to the store's real mailing address; marketing campaigns require it.

## Running queued messages

Call `POST /api/internal/email-jobs` on a schedule, supplying either:

```
Authorization: Bearer YOUR_EMAIL_JOB_SECRET
```

or `x-job-secret`. Run it every minute in production. Each request claims a limited batch; Resend idempotency keys and Firestore job state prevent normal duplicate sends. Restrict this endpoint to the scheduler secret and never expose that secret to the browser.

## Operations

- Staff manage fulfilment from `/admin/orders`.
- Customers submit and review returns at `/returns`.
- Signed-in customers can subscribe to one-time product price-drop alerts from a product page. Alerts use the discounted selling price and are delivered by the scheduled email-job worker.
- New account signups receive a queued welcome email. Newsletter consent is optional at signup; verified customers can also opt in or out at `/profile/email-preferences`.
- Admins can queue a campaign at `/admin/email-campaigns`. Only verified, opted-in customers receive marketing campaigns. Each campaign includes a signed unsubscribe link and one-click unsubscribe headers; unsubscribe requests are checked again immediately before send.
- Customers who previously changed the old browser-only newsletter preference must opt in again in their profile. That old preference was not stored server-side and is not migrated as consent.
- Campaigns and welcome emails use the existing scheduled email worker. It processes up to 25 queued emails per invocation, so large campaigns are sent gradually.
- Failed queue records remain in `notificationQueue` with their last error for inspection and retry.
- Suppressed recipients are stored as hashes in `emailSuppressions`; raw addresses are not used as document IDs.

Before launch, run `npm run check:launch`, `npm run typecheck`, and `npm run build`.
