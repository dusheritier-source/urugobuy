# Urugo shopping assistant

The **Ask Urugo** button opens a responsive shopping chat on storefront pages. It supports product discovery, current details and comparisons, approved store-policy answers, delivery-cost estimates, secure links to account order status, product-photo search, and confirmed add-to-cart proposals. It is hidden on admin and checkout pages.

## Enable real Gemini AI replies

Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then add these **server-only** settings to `.env.local` for development and your host's environment settings for deployment:

```dotenv
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash-lite
ASSISTANT_DAILY_REQUEST_LIMIT=300
```

The default model is selected from the supported Gemini models intended for free-tier use. Google's free quota, available models, and rate limits can change and are controlled by Google; the app's daily request limit is not a guarantee of free usage. Never paste an API key into chat, commit it, or give it a `NEXT_PUBLIC_` prefix. Restart the server after changing environment settings. The model is configurable within the supported list; it is a starting implementation choice, not a claim that it has been benchmarked on your shoppers.

Without the key, the app shows an honest unavailable/setup state and links to product browsing and support. There is no simulated AI response path in the production API. Automated tests inject mocked Gemini responses or intercept browser requests explicitly.

The server calls Google's Gemini OpenAI-compatible chat-completions endpoint using `fetch`, with strict tool schemas and a validated structured final reply. The API key is sent only in the server-side authorization header.

## Data and actions

- `lib/server/catalog.ts` is the product source shared by catalog/home/deals browsing, product details, photo search and the assistant. With server Firebase/Google credentials, only validated published Firestore products are returned. An empty live catalog stays empty. Browser Firebase settings alone use the bundled starter catalog; these are demonstration products until imported/published in Firestore. Local-storage admin drafts do not change the published catalog.
- The assistant reads fresh catalog data per request. Browsing can cache for up to a minute. Published-product edits invalidate the process cache. Checkout still performs its transactional stock and price checks. Product cards, budget filters and cart proposals use the discounted selling price; display values are never supplied by the model.
- `search_products` applies price, stock, category and brand constraints in code. `get_products` provides verified descriptions/attributes. Selected IDs must have been observed from verified context or tool results. Active search filters are reapplied before cards or cart proposals are returned. Natural-language constraint interpretation still depends on model quality and must be evaluated with real conversations.
- `store_policy` reads `lib/store-policies.ts`. Shipping/returns pages share those rules. Warranty duration is explicitly unknown unless documented for the product. Arrival dates are not invented. Delivery estimates share `lib/order-pricing.ts` with server order creation; they exclude future coupons and do not reserve stock.
- `get_order` returns a link to `/profile` for signed-in shoppers or `/login` for guests. Gemini free-tier chat never reads private order records. Order details remain in the existing authenticated account pages. The core?s ownership-checked summary helper remains unit-tested but is not enabled for this provider.
- `prepare_cart` has no write capability. The UI shows **Confirm add to cart**. On click, `/api/assistant/cart` reads current published data and checks quantity and selling price. A changed price requires a second confirmation. Only after successful validation does the existing browser cart store add the product. Checkout/payment remain separate explicit flows.
- Photo attachments first go through `/api/search/visual`; the assistant receives only verified product candidate IDs and public catalog information. The photo itself is not sent to Google. See `VISUAL_SEARCH.md` for model hosting/cache requirements.

## Privacy and operating limits

Messages remain in React memory for the current browser tab and are cleared by New chat, reload, or account changes. Closing the panel preserves the conversation in tab memory. No chat is written to local storage or the application's database. Requests include bounded recent history (12 messages, 2,000 characters each), relevant public product information and public product information. Users are informed that messages are sent to Google; the privacy page describes this processing. Review Google's applicable API data-use and retention terms before launch.

Each assistant turn permits up to four Gemini API calls, six total tool calls, and 1,200 output tokens per model call. Input bodies are limited to 32 KiB. Provider calls have a 20-second timeout; the overall request deadline is 65 seconds. Closing/stopping aborts client requests and prevents stale replies from being appended. The host route duration budget is 90 seconds and requires Node.js hosting.

Rate limits are eight requests per IP/minute and sixty per IP/day per process. There are at most three active turns per process. A configurable UTC daily request allowance defaults to 300: a Firestore transaction shares that cap across replicas when server catalog credentials are configured; demo mode uses a process-local counter. Failed attempts count conservatively. Request caps are not dollar spend limits. Enforce trusted-proxy/edge rate limits, keep the Google project on Free Tier, and watch aggregate usage when deploying. Logs record model name, token counts and elapsed time, not message contents or provider error payloads. Order metadata stays outside these usage logs.

## Verification

```sh
npm run test:assistant
npm run typecheck
npm run build
npx playwright install chromium
npm run test:assistant:browser
```

Browser tests run the production build on port 3100. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use an existing compatible Chromium installation. The tests explicitly mock AI replies while exercising the interface, real catalog/cart endpoints, API validation and missing-key behavior. Core tests inject model responses and exercise the actual tool loop, filtering, ownership checks, budgets, policies, cart proposals and abort behavior. These do not measure the real model's language understanding or recommendation quality.

After configuring the key, start the app and run:

```sh
npm run check:assistant
```

This makes real Gemini API requests and checks budget/stock constraints, policy sources and unauthenticated order access. It prints no key or private chat history. `ASSISTANT_TEST_URL` optionally selects another running instance. Before public launch, also review genuine English/French shopping conversations, follow-up budgets, ambiguous specifications, prompt-injection attempts and API failures. Evaluate Kinyarwanda separately before advertising that language. Live Gemini and live Firestore authorization cannot be verified without their respective credentials.
