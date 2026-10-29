# Price-drop alerts

Shoppers can watch a product from its purchase panel, optionally set a target price, and receive private in-app notifications at **Account → Price-drop alerts** and the desktop/mobile bell. Watches stay active for successive new lows until paused. In-app alerts do not need an AI key, email provider, or billing account for an AI service. Firebase server access is still required; database/hosting quotas are separate.

## Shopper behavior

- Sign in, open a product, and choose **Alert me when the price drops**. An empty target means any drop below the watch's previous notified low. A target is inclusive: the selling price must reach that amount or lower and also be lower than the watch's reference price.
- The reference starts at the current effective price (after item discounts). Further notifications require a new lower cent amount. Price increases and a return to an already-notified price do not generate another alert. Changing the target, reactivating a paused watch, or resetting a watch after a currency change starts a new reference/version. Saving unchanged settings does not reset the reference.
- Alerts require a published, in-stock product. A price cut while sold out is checked again when the product becomes available. Currency changes suppress old-currency comparisons until the shopper resets the watch.
- Alerts appear in the private account inbox without email. Email is an optional, unchecked choice and requires a verified account email plus a configured sender. The client cannot choose another recipient address; the backend uses the authenticated user's verified email.
- The account page shows paginated watches, notification history, paused state, current public prices and a control to mark shown notifications as read. The bell displays the current unread count, refreshed on focus/at intervals. Pausing a watch stops future notifications and suppresses its queued email jobs. Past in-app notifications remain as history.

## Live product publishing

The admin product editor retains **Save draft** for local edits and now provides **Publish to store**. Publishing uses the existing staff-authenticated product API; newly published records receive server product IDs. Existing live records retain their IDs. The admin page reads the published catalog, while browser drafts can overlay editor values until published.

A price-only PATCH previously applied Zod creation defaults (`rating: 0`, `status: draft`). `productUpdateSchema` now preserves omitted values, so a price edit keeps the published status and existing rating. Product image validation supports bundled `/images/` assets and HTTPS image URLs while rejecting path traversal and script URLs.

Product PATCH commits the product edit and a pending `priceAlertEvents` outbox record in the **same Firestore transaction**. A discount change is a price change. Becoming published or returning to stock also triggers evaluation. Client Firestore product writes are denied by the supplied rules; publish through the staff API so the outbox is created. Direct Admin SDK/console imports bypass this application logic and need an equivalent event/import process.

## Processing and retries

The product API tries the first page inline after commit. Notification failure does not report a committed product edit as failed: the pending event stays available for retry. The protected `POST /api/internal/price-alerts` endpoint processes up to ten pages per call. Each event page scans up to 100 active watchers ordered by document path, saves its cursor, and uses a 90-second lease. There is no 400-subscriber ceiling. Expired leases are reclaimed before new work. Deploy `firestore.indexes.json` so collection-group and pending/expired-event queries are available.

For each eligible watcher, a Firestore transaction re-reads the watch and the **current** product, creates a deterministic private notification, optionally creates an email job, and updates the last-notified price together. Retried events/pages cannot duplicate that same notification/email job. The cursor order is independent of subscription update timestamps. Requests to cancel, change targets, or change currency are respected using the current watch and its version.

`users/{uid}/notifications` and `priceAlerts` allow owner reads only; client writes are denied. APIs authenticate Firebase ID tokens, derive the owner from the token, validate product IDs and thresholds, bound input bodies, and use per-user rate limits. Notifications are never read using an owner ID supplied by a shopper. The account page's existing order-store selector was also stabilized to prevent a React update loop during sign-in.

## Setup

1. Configure the existing Firebase Admin service account or Google application credentials and publish real products.
2. Deploy the updated Firestore rules and indexes.
3. Set a private `PRICE_ALERT_JOB_SECRET` on the host. A random value is prepared in local `.env.local` without being printed. The worker can also fall back to the existing `EMAIL_JOB_SECRET`.
4. Invoke the retry endpoint regularly from your server scheduler/cron. For a running local app, use:

   ```sh
   npm run jobs:price-alerts
   ```

   This reads `.env.local` and sends the secret only in the job-authentication header. `PRICE_ALERT_WORKER_URL` optionally selects another running host. Each invocation handles bounded pages; large events may require several invocations.

5. Optional email delivery uses the existing `RESEND_API_KEY`, `EMAIL_FROM` and protected email-job processor. The price worker only queues messages; the existing `/api/internal/email-jobs` worker delivers them. The sender template links to price-alert management. Before sending, that worker skips canceled/changed watches, disabled email preferences for that watch, products no longer in stock/published, or prices that have risen above the notified amount. Delivery failures remain visible as failed email jobs for existing operational handling; in-app notifications remain available independently.

The deployment must schedule the retry workers for production recovery and larger audiences. Neither the job scheduler nor external Firebase/email services are provisioned or deployed by local implementation. No real customer email is sent by the automated tests.

## Verification

```sh
npm run test:price-alerts
npm run typecheck
npm run build
npm run test:price-alerts:browser
```

Pure and transactional in-memory workflow tests cover effective prices, target boundaries, consecutive new lows, canceled/invalid/out-of-stock records, currency changes, 450 subscribers across multiple pages, transaction failure/replay, lease handling, email opt-in and creation-default regressions. Browser tests mock Firebase authentication and price-alert API data for authenticated UI flows; they do not bypass production authorization. Real unauthenticated endpoint checks verify that alert and worker routes reject access. Live Firebase indexes/permissions and actual email delivery require their service credentials and deployment.
