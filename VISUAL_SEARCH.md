# Search by photo

Shoppers can open **Search by photo** from desktop/mobile navigation or the product catalog. They can upload or drop a JPG, PNG, or WebP (10 MB maximum), or use the mobile camera picker. The dialog shows a preview, ranked product links, category and stock filters, change/remove controls, cancellation, retry errors, and an honest empty state. Escape closes it and returns keyboard focus to the trigger.

## Matching and privacy

`POST /api/search/visual` accepts a multipart `image` file. Sharp verifies actual image contents, rejects images smaller than 32 pixels on either side or larger than 25 megapixels or blank photos without visible detail, fixes orientation, and bounds dimensions. A quantized CLIP vision encoder (`Xenova/clip-vit-base-patch32`, Transformers.js) computes an image embedding. Cosine similarity compares it with up to three images per published catalog product. Results below 0.70 are excluded, products are deduplicated, and the best 24 matches are returned. Similarity is a ranking measure, not an identification probability.

The uploaded photo is processed in server memory and is **not saved**, sent to an external inference service, or included in the embedding cache. The public model downloads from Hugging Face on first use. Catalog image downloads are restricted to local public assets and the existing Unsplash / Google Storage / Firebase Storage hosts; redirects and arbitrary URLs are rejected. Upload bodies are bounded while streaming, responses use `no-store`, and search has process-local rate and concurrency limits. Production edge rate limits should complement the existing process-local limiter.

Published Firestore products are used when server credentials or Google application credentials are configured. Local environments with browser Firebase settings alone use the starter catalog. The product detail pages resolve from the same source. Catalog metadata caches for one minute; the visual index refreshes within five minutes. Changes to a product's `updatedAt` or image URL invalidate its embedding cache. Locally staged admin edits must be published before appearing in server searches.

## Run and deploy

Requires a Node.js host supporting the native Sharp and ONNX Runtime CPU packages (not the Edge runtime). No paid vision API or API key is needed. The host needs outbound access to Hugging Face's model/CDN endpoints for the first model download, and enough memory for the model. Use a persistent Node service or a function plan allowing cold model initialization; the route declares a 300-second duration budget. Serverless environments may reload the model after a cold start.

The committed `lib/server/visual-search-index.json` contains embeddings for the starter catalog, so those images do not need encoding on each deployment. After changing that catalog, update product timestamps and regenerate it:

```sh
npm run index:visual-search
```

`VISUAL_SEARCH_CACHE_DIR` optionally sets a writable directory shared between indexing and serving. By default, model files and public catalog embeddings use the operating system temporary directory under `urugo-visual-search-v1`. Do not store this cache in a public web directory. Read-only embedding caches still permit in-memory matching, but the model requires a writable cache or pre-provisioned model files.

For larger live catalogs, prewarm a long-running instance after publishing products; encoding a new catalog synchronously can exceed short function timeouts. This implementation uses an in-process linear index appropriate for the current catalog size.

## Verification

```sh
npm run test:visual-search
# Also exercise the real model against resized/recompressed photos:
RUN_MODEL_TESTS=1 npm run test:visual-search
# Install Chromium once, then exercise UI, API, and localized navigation:
npx playwright install chromium
npm run build
npm run test:visual-search:browser
npm run typecheck
npm run build
```

On PowerShell use `$env:RUN_MODEL_TESTS = '1'` before running the test command. Set `VISUAL_SEARCH_CACHE_DIR` consistently to reuse a model already downloaded by the indexing script. Browser tests serve the production build and use `.cache/visual-search` and port 3100. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to an existing compatible Chromium executable. The pure tests cover image decoding limits, unsafe paths/hosts, ranking, deduplication, and cache invalidation. Model tests verify the correct first result across four catalog categories. Browser tests exercise real image search, filters, localized product navigation, validation, retry/empty results, cancellation, mobile capture, and focus restoration.
