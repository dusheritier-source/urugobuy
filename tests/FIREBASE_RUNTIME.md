# Firebase Admin runtime compatibility

Firebase Admin is pinned to 13.10.0 because the 14.x dependency chain loads
`jose` 6 with CommonJS `require()` through `jwks-rsa` 4. This crashes during
module initialization on Vercel with `ERR_REQUIRE_ESM`, including localized
pages that import catalog or authentication code indirectly.

Upstream issue: https://github.com/auth0/node-jwks-rsa/issues/507

Run `node --test tests/firebase-runtime.test.mjs` before changing this pin.
The test disables Node's require(ESM) support to reproduce the production
restriction, without needing Firebase credentials or network requests.

Deploy both `package.json` and `package-lock.json` together. The dependency
change takes effect after a new deployment; refreshing the old deployment
does not update its installed packages. Then check `/en_RW`,
`/en_RW/products`, `/en_RW/about`, and `/en_RW/contact` on the live site.
