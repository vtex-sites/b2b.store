# b2b.store

A FastStore B2B template — a monorepo with the official `starter.store`
discovery base plus the
[`@vtex/faststore-plugin-buyer-portal`](https://github.com/vtex/faststore-plugin-buyer-portal)
plugin, the VTEX B2B guideline configuration, and a FastCheckout module,
pre-wired in.

Built from ticket **B2BTEAM-3645**. Status: **beta / partial validation** —
see [Known limitations](#known-limitations) below.

## What's included

- Monorepo layout (Turborepo): `packages/discovery` (storefront) +
  `packages/checkout` (FastCheckout customizations), wired together via
  `faststore.json`.
- `@faststore/cli` `^4.4.0`, `@vtex/faststore-plugin-buyer-portal` `^2.0.9` in
  `packages/discovery`.
- `discovery.config.js` with the plugin registered and B2B-oriented defaults
  (`hideUnavailableItems: true`, `enableFaststoreMyAccount: true`).
- FastCheckout scaffolded in `packages/checkout` (via `@vtex/checkout`'s
  `defineExtensions`) with no example/demo extension — add your own
  customizations there.
- Root `package.json` has the `nohoist` workaround already applied for
  `@vtex/faststore-plugin-buyer-portal`, required for this monorepo layout.
- Cypress test scripts wired to the plugin's own test suite (`yarn test-plugin`
  inside `packages/discovery`).

## What's NOT included (by design — kept lean)

- No CMS content (`cms/` folder), no custom `src/` overrides beyond the
  framework defaults (`themes/`, `fonts/`) in `packages/discovery` — add your
  store's own sections, components, and theme tokens there per
  `packages/discovery/AGENTS.md`.
- No example FastCheckout extensions — `packages/checkout/src/index.tsx`
  ships with an empty `defineExtensions({})`.

## Setup

1. Replace every `{ACCOUNT_NAME}` placeholder with your target VTEX account
   name:
   - `packages/discovery/discovery.config.js` — `api.storeId`, `storeUrl`,
     `secureSubdomain`, `checkoutUrl`, `loginUrl`, `accountUrl`, and
     `vtexHeadlessCms.webhookUrls` (this last one uses the account's
     `.myvtex.com` domain, NOT the storefront domain).
   - `faststore.json` (repo root) — the top-level `stores` key.
2. Install dependencies from the repo root: `yarn install`
3. Run locally (both discovery and checkout, via Turborepo): `yarn dev`
   - Discovery: http://localhost:3001
   - Checkout: http://localhost:3002
4. Production build: `yarn build`

Each package can also be run individually from inside
`packages/discovery` or `packages/checkout` using their own `yarn dev` /
`yarn build` scripts.

## Account prerequisites (not part of this repo — configure manually)

### VTEX IO apps required on the target account

- `vtex.profile-session`
- `vtex.authentication-session`
- `vtex.shopper-session`
- `vtex.search-session`
- `vtex.buyer-portal-graphql`
- `vtex.contracts-management`
- `vtex.reviews-and-ratings`
- `vtex.safedata`
- `vtex.collections-agent`
- `vtex.login` (or `vtex.login-alternative-key` for the new B2B Login UI)

### Feature flags (request manually via Slack — not automatable from this repo)

| Feature Flag | Owning team | Slack channel |
|---|---|---|
| emailRectification / allow-email-rectification / enableProfileIdentificationByLoggedInUserId | Storage / Payments / Checkout | #team-dev-storage, #team-dev-payments, #team-dev-checkout |
| useUnitsForExtraclaims | Identity | #team-dev-identity |
| enableStorefrontPermissions | Identity | #team-dev-identity |
| useIdentifier / useCustomerId | Identity | #team-dev-identity |
| SIGN_IN_TO_ACCESS | Checkout Experience | #team-dev-checkout |
| Multi delivery | Checkout Experience | #team-dev-checkout |
| useNewContactInfoBehavior | Checkout | #team-dev-checkout |
| allowOrderFormCustomFields | Checkout | #team-dev-checkout |
| Refresh Token → 10 min | Identity | #team-dev-identity |

**Important:** once `enableStorefrontPermissions` is active, every user
(including AppKeys) must belong to an Organization Unit and hold at least the
**4-Buyer** and **9-Address Manager** roles (add **5-Personal Cards User** if
personal card entry is needed). After enabling the Identity flags, open
`/admin/authentication` and save (no changes needed) to persist login
behavior.

### Out of scope of this repo (infra/account-level)

- VTEX account creation, subdomain (`#traffic`) and License Manager setup
- Domain migration (`#request-domains-migration`), cache policies (`#traffic`)
- CDN / unified domain (contact: Gabriel Paladino)
- VTEX Intelligent Search indexing (prerequisite for Buyer Portal, configured
  after the store is running)
- Card tokenization (`allow-card-tokenization-by-account`,
  `allow-tokenization-deploy`)
- **FastCheckout is scaffolded in this template, but it is only supported in
  the US region today (VTEX Commercial Policy)** — accounts outside that
  region can leave `packages/checkout` unused/unconfigured; the monorepo
  structure itself doesn't require FastCheckout to be active.
- Masterdata: the `addressType` field must be searchable/indexable on the `AD`
  table
- Contract Management admin permissions (View/Edit Contracts)

## Monorepo structure

This template was migrated from a single-package `starter.store` layout to a
monorepo using the official `@vtex/fsp-cli` tooling
(`fsp init --from-discovery` to create `packages/discovery`, then
`fsp create {ACCOUNT_NAME} checkout packages/checkout` to add the FastCheckout
module). Root-level files:

- `faststore.json` — maps each package (`discovery`, `checkout`) to its path
  and local dev port, keyed by `{ACCOUNT_NAME}`.
- `turbo.json` — Turborepo pipeline (`build`, `dev`).
- `package.json` — workspaces + the `nohoist` entry for
  `@vtex/faststore-plugin-buyer-portal` (required so the plugin isn't hoisted
  in a way that breaks its own resolution — this is a known FastStore
  monorepo workaround, remove it once FastStore supports this scenario
  natively).

**Caveat found during migration:** `fsp init --from-discovery` reads the
locally logged-in VTEX account (via VTEX Toolbelt) and may silently replace
the `{ACCOUNT_NAME}` placeholder with that real account name in
`discovery.config.js` and `faststore.json` instead of preserving the
placeholder. If you re-run this migration yourself, verify both files still
say `{ACCOUNT_NAME}` afterward — don't assume the placeholder survived.

**Dependency conflicts found and fixed while adding FastCheckout to the same
workspace** (all in root `package.json`, needed for `yarn build`/`yarn dev` to
work at all — independent of the `{ACCOUNT_NAME}` placeholder issue below):

- `**/@vtex/checkout-ui-core` and `**/@vtex/checkout-ui-core/**` were added to
  `nohoist`. Without this, yarn hoists `@vtex/checkout-ui-core`'s bundled
  Next.js 14 to the workspace root `node_modules/.bin/next`, shadowing the
  Next.js 16 that `@faststore/cli`/`@faststore/core` require — the build then
  fails immediately with `next build: error: unknown option '--webpack'`
  (a flag that only exists on the newer Next.js version).
- `resolutions.autoprefixer` is pinned to `^10.4.0`. `@faststore/core` needs
  `autoprefixer ^10`, but a transitive dependency of `@vtex/sales-app`
  (`draftjs-to-html`) needs `^9` — the version conflict means yarn can't
  hoist either copy to root, so Next.js's CSS pipeline fails with
  `Cannot find module 'autoprefixer'`. `autoprefixer` is also added as an
  explicit root `devDependency` — the `resolutions` pin alone was not enough
  to get yarn to hoist a copy to the root `node_modules`, an explicit
  top-level dependency was required.
- `resolutions.react` / `resolutions.react-dom` are pinned to `^18.3.1`
  (matching what `@vtex/sales-app` needs) and a `postinstall` script removes
  `packages/discovery/node_modules/react` and `react-dom` after every
  install. Even with matching resolved versions, yarn classic still
  installed a second physical copy of React nested under
  `packages/discovery`, and having two React instances in the same render
  tree causes cryptic `TypeError: Cannot read properties of null (reading
  'useEffect')` crashes during Next.js static prerendering (Node's module
  resolution walks up directories, so removing the nested copy makes it
  resolve to the single deduped copy at the workspace root instead).

## Known limitations

- **Version drift vs. internal guideline v1.4:** the guideline documents
  `@vtex/faststore-plugin-buyer-portal ^1.1.3`, `@faststore/cli ^3.51.0`,
  `experimental.nodeVersion: 20`, and `experimental.refreshToken: true`. This
  template uses the latest published versions instead
  (`buyer-portal ^2.0.9`, `cli ^4.4.0`, `nodeVersion: 24`,
  `refreshToken: false`), matching what the `b2bfaststoredev.store` reference
  account currently runs. **`refreshToken` was not re-verified against the
  Identity team's current guidance** — confirm before relying on it.
- **`contentSource.type: "CP"`** is the current official scaffold default;
  its interaction with the legacy VTEX Headless CMS webhook flow
  (`vtexHeadlessCms.webhookUrls`) has not been validated end-to-end.
- **Not validated against a live VTEX B2B account** — `yarn build` currently
  fails in the default state: TypeScript and webpack compile successfully,
  and most pages statically generate, but prerendering one of the
  account-dependent pages (observed on `/checkout`, `/404`, or `/500`
  depending on build-worker scheduling) fails with HTTP 400 because the
  `{ACCOUNT_NAME}` placeholder cannot resolve a real backend. Replacing this
  placeholder with a provisioned VTEX account (per Setup above) is expected
  to resolve this. The failure does not confirm whether Buyer Portal or
  FastCheckout behave correctly against a real account — that requires the
  prerequisites above.
- **FastCheckout module is unvalidated against a real account** — it was
  scaffolded via the official `fsp create` command with no example
  extension; end-to-end behavior against a provisioned VTEX account has not
  been tested.
- **Never commit `secrets.hidden.json` / `secrets.revealed.json`** (inside
  `packages/discovery`) — both are excluded in that package's `.gitignore`. A
  sibling reference repo currently has `secrets.hidden.json` tracked in git;
  do not repeat that mistake here.

## Docs

- [FastStore documentation](https://developers.vtex.com/docs/guides/faststore)
- Ticket: B2BTEAM-3645
