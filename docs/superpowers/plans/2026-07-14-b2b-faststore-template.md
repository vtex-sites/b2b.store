# B2B FastStore Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a lean, single-package FastStore template (repo `b2b.store`) that ships the `@vtex/faststore-plugin-buyer-portal` plugin and the B2B-specific `discovery.config.js`/`package.json` settings out of the box, so it can later be registered as a template option in FastStore Cloud (WebOps).

**Architecture:** Single Next.js/FastStore "discovery" package (no monorepo, no FastCheckout) scaffolded via the official `@faststore/cli create` command — this pulls the *current* upstream `starter.store` template (verified live: v0.1.0, `@faststore/cli` 4.4.0, Next 16-based, no legacy `next`/`plugins` fields) rather than a stale local clone. B2B customization is layered on top: plugin dependency, `discovery.config.js` plugin/session/URL/experimental fields, and a README documenting every manual account-level prerequisite from the internal guideline (v1.4) that the template itself cannot automate.

**Tech Stack:** `@faststore/cli` ^4.4.0, `@vtex/faststore-plugin-buyer-portal` ^2.0.9, React 18, TypeScript ^5.9.3, Cypress ^13, Yarn (classic, matching the pinned `packageManager` used across every reference repo).

## Global Constraints

- Package manager: Yarn classic, `packageManager` field pinned to `yarn@1.22.22+sha512.a6b2f7906b721bba3d67d4aff083df04dad64c399707841b7acf00f6b133b7ac24255f2652fa22ae3534329dc6180534e98d17432037ff6fd140556e2bb3137e` (same hash used in `starter.store`, `b2bfaststoredev.store`, and the plugin repo itself — confirms this is the org-wide pin, not a coincidence).
- `@vtex/faststore-plugin-buyer-portal`: pin to `^2.0.9` (latest published; verified via `npm view`, peerDeps are only `react@^18.2.0` / `react-dom@^18.2.0`, no transitive conflicts).
- `@faststore/cli`: pin to `^4.4.0` (latest published; its own dependency `@faststore/core@4.4.0` requires `next@^16.2.6` transitively — do **not** declare an explicit `next` dependency in this template's `package.json`, mirroring `b2bfaststoredev.store`, which has none. Declaring one risks pinning a stale/conflicting version).
- `typescript`: `^5.9.3` (matches the proven-working `b2bfaststoredev.store`; do not jump to the `7.x` line available on npm — unverified against this stack).
- `cypress`: `^13.0.0` (matches both `b2bfaststoredev.store` and the plugin's own devDependency; the freshly-scaffolded official template still pins the older `12.17.4`, which is stale relative to what the plugin's own Cypress config expects).
- No demo/example content: drop any placeholder component (e.g. a demo `ProductDetails` section) that isn't required for the build to succeed — this template must be minimal.
- All account-specific URLs (`storeUrl`, `secureSubdomain`, `checkoutUrl`, `loginUrl`, `accountUrl`, `vtexHeadlessCms.webhookUrls`) must stay as clearly-marked placeholders in the committed config — never a real account domain.
- Never commit a secrets/credentials file. `b2bfaststoredev.store` currently has `packages/discovery/secrets.hidden.json` tracked in git (its `.gitignore` only excludes `secrets.revealed.json`) — this template's `.gitignore` must explicitly exclude both `secrets.hidden.json` and `secrets.revealed.json` so this mistake cannot repeat.

---

## File Structure

```
b2b.store/
├── .gitignore                  # copied from official scaffold + secrets.*.json exclusions
├── .github/                    # copied verbatim from official scaffold (CODEOWNERS, PR template, issue templates, dependabot)
├── AGENTS.md                   # copied verbatim from official scaffold (explains .faststore/ vs src/ merge model)
├── README.md                   # rewritten: B2B setup, prerequisites, limitations
├── package.json                # official scaffold + buyer-portal dependency + plugin test scripts
├── discovery.config.js         # official scaffold + plugins/session/url/experimental B2B overrides
├── tsconfig.json                # copied verbatim
├── next-env.d.ts               # copied verbatim
├── cypress.config.ts           # copied verbatim
├── vercel.json                 # copied verbatim (if present in scaffold)
├── vtex.env                    # copied verbatim
├── src/
│   ├── themes/custom-theme.scss  # copied verbatim (empty design-token shell)
│   └── fonts/WebFonts.tsx        # copied verbatim
└── docs/superpowers/plans/2026-07-14-b2b-faststore-template.md  # this file
```

No `cms/` folder, no monorepo `packages/`, no `SelfManagementRouter`/`myAccount`/`pages/pvt`/`components/overrides` — those are `b2bfaststoredev.store`-specific customizations, not template requirements.

---

## Task 1: Scaffold the base project via the official FastStore CLI

**Files:**
- Create: everything under `~/repositories/b2b.store/` (repo root) via CLI scaffold + move
- Test: none (structural verification only)

**Interfaces:**
- Produces: the full official `starter.store` v0.1.0 file tree at repo root, which every later task modifies in place.

- [ ] **Step 1: Scaffold into a throwaway subfolder**

```bash
cd ~/repositories/b2b.store
npx --yes @faststore/cli create discovery
```

Expected output: `Pulling starter.store template...` then `Discovery created successfully! You can find it at discovery`

- [ ] **Step 2: Move scaffolded files up to repo root**

```bash
cd ~/repositories/b2b.store
shopt -s dotglob
mv discovery/* .
rmdir discovery
shopt -u dotglob
```

- [ ] **Step 3: Verify structure**

```bash
ls -la ~/repositories/b2b.store
```

Expected: `package.json`, `discovery.config.js`, `tsconfig.json`, `src/`, `.github/`, `AGENTS.md`, `README.md`, `.gitignore`, `vtex.env` all present at repo root; no leftover `discovery/` directory.

- [ ] **Step 4: Commit**

```bash
cd ~/repositories/b2b.store
git add -A
git commit -m "chore: scaffold base FastStore starter via official CLI"
```

---

## Task 2: Add the Buyer Portal plugin dependency and test scripts

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `package.json` produced by Task 1 (has `dependencies.@faststore/cli`, `dependencies.graphql`, `dependencies.react`, `dependencies.react-dom`, `devDependencies.typescript`, `devDependencies.cypress`).
- Produces: `package.json` with `@vtex/faststore-plugin-buyer-portal` in `dependencies`, `cypress` bumped in `devDependencies`, and two new `scripts` entries (`test-plugin`, `test-plugin:ci`) that later tasks and README instructions reference by name.

- [ ] **Step 1: Edit `package.json`**

Replace the generated `package.json` content with:

```json
{
  "name": "b2b.store",
  "version": "0.1.0",
  "description": "FastStore B2B Template — starter.store + Buyer Portal plugin",
  "private": true,
  "scripts": {
    "dev": "faststore dev",
    "build": "faststore build",
    "start": "faststore start",
    "cms-sync": "faststore cms-sync",
    "test": "faststore test",
    "test-plugin": "cypress open --config-file node_modules/@vtex/faststore-plugin-buyer-portal/cypress.config.ts",
    "test-plugin:ci": "cypress run --config-file node_modules/@vtex/faststore-plugin-buyer-portal/cypress.config.ts"
  },
  "dependencies": {
    "@faststore/cli": "^4.4.0",
    "@vtex/faststore-plugin-buyer-portal": "^2.0.9",
    "graphql": "^16.11.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@cypress/code-coverage": "^3.12.1",
    "@lhci/cli": "^0.9.0",
    "@testing-library/cypress": "^10.0.1",
    "cypress": "^13.0.0",
    "cypress-axe": "^1.5.0",
    "cypress-wait-until": "^2.0.1",
    "typescript": "^5.9.3"
  },
  "author": "VTEX",
  "packageManager": "yarn@1.22.22+sha512.a6b2f7906b721bba3d67d4aff083df04dad64c399707841b7acf00f6b133b7ac24255f2652fa22ae3534329dc6180534e98d17432037ff6fd140556e2bb3137e"
}
```

- [ ] **Step 2: Validate JSON syntax**

```bash
cd ~/repositories/b2b.store
node -e "console.log(Object.keys(require('./package.json').dependencies))"
```

Expected: prints an array including `@vtex/faststore-plugin-buyer-portal`.

- [ ] **Step 3: Commit**

```bash
cd ~/repositories/b2b.store
git add package.json
git commit -m "feat: add buyer-portal plugin dependency and plugin test scripts"
```

---

## Task 3: Configure `discovery.config.js` for B2B

**Files:**
- Modify: `discovery.config.js`

**Interfaces:**
- Consumes: the `discovery.config.js` produced by Task 1 (default single-tenant `newstore` config with `contentSource`, `seo`, `theme`, `platform`, `api`, `session`, `cart`, URLs, `previewRedirects`, `lighthouse`, `cypress`, `analytics`, `experimental`, `vtexHeadlessCms` keys — no `plugins` key present by default).
- Produces: same file with a `plugins` array added and B2B-specific values in `seo`, `api.storeId`, URLs, `experimental`, and `vtexHeadlessCms.webhookUrls`, all documented as placeholders in README (Task 4).

- [ ] **Step 1: Edit `discovery.config.js`**

Replace the generated file content with:

```js
module.exports = {
  contentSource: {
    type: "CP",
  },
  seo: {
    title: "B2B FastStore",
    description: "A fast and performant B2B store framework",
    titleTemplate: "%s | B2B FastStore",
    author: "VTEX",
  },

  // Theming
  theme: "custom-theme",

  // Ecommerce Platform
  platform: "vtex",

  // Plugins
  plugins: ["@vtex/faststore-plugin-buyer-portal"],

  // Platform specific configs for API
  // {ACCOUNT_NAME} must be replaced with the target VTEX account name — see README "Setup" section
  api: {
    storeId: "{ACCOUNT_NAME}",
    workspace: "master",
    environment: "vtexcommercestable",
    hideUnavailableItems: true,
    incrementAddress: false,
  },

  // Default session
  session: {
    currency: {
      code: "USD",
      symbol: "$",
    },
    locale: "en-US",
    channel: '{"salesChannel":"1","regionId":""}',
    country: "USA",
    deliveryMode: null,
    addressType: null,
    postalCode: null,
    geoCoordinates: null,
    person: null,
  },

  cart: {
    id: "",
    items: [],
    messages: [],
    shouldSplitItem: true,
  },

  // Production URLs — replace {ACCOUNT_NAME} with the target VTEX account/store domain. See README "Setup" section.
  storeUrl: "https://{ACCOUNT_NAME}.vtexfaststore.com",
  secureSubdomain: "https://{ACCOUNT_NAME}.vtexfaststore.com",
  checkoutUrl: "https://{ACCOUNT_NAME}.vtexfaststore.com/checkout",
  loginUrl: "https://{ACCOUNT_NAME}.vtexfaststore.com/api/io/login",
  accountUrl: "https://{ACCOUNT_NAME}.vtexfaststore.com/api/io/account",

  previewRedirects: {
    home: "/",
    plp: "/office",
    search: "/s?q=headphone",
    pdp: "/apple-magic-mouse/p",
  },

  // Lighthouse CI
  lighthouse: {
    server: process.env.BASE_SITE_URL || "http://localhost:3000",
    pages: {
      home: "/",
      pdp: "/apple-magic-mouse/p",
      collection: "/office",
    },
  },

  // E2E CI
  cypress: {
    pages: {
      home: "/",
      pdp: "/apple-magic-mouse/p",
      collection: "/office",
      collection_filtered:
        "/office/?category-1=office&facets=category-1",
      search: "/s?q=headphone",
    },
    browser: "electron",
  },

  analytics: {
    gtmContainerId: "",
  },

  // Note: nodeVersion 24 and refreshToken:false match the currently-running
  // b2bfaststoredev.store reference account. The internal guideline v1.4
  // documents nodeVersion:20 and refreshToken:true — those are stale; verify
  // refreshToken behavior with the Identity team before flipping it (see README limitations).
  experimental: {
    nodeVersion: 24,
    cypressVersion: 12,
    enableFaststoreMyAccount: true,
    refreshToken: false,
  },

  // {ACCOUNT_NAME} must use the .myvtex.com domain, NOT the storefront domain
  vtexHeadlessCms: {
    webhookUrls: [
      "https://{ACCOUNT_NAME}.myvtex.com/cms-releases/webhook-releases",
    ],
  },
};
```

- [ ] **Step 2: Validate the config loads and required keys are present**

```bash
cd ~/repositories/b2b.store
node -e "
const c = require('./discovery.config.js');
console.assert(c.plugins.includes('@vtex/faststore-plugin-buyer-portal'), 'plugin missing');
console.assert(c.api.storeId === '{ACCOUNT_NAME}', 'storeId placeholder missing');
console.log('discovery.config.js OK');
"
```

Expected: prints `discovery.config.js OK` with no assertion errors.

- [ ] **Step 3: Commit**

```bash
cd ~/repositories/b2b.store
git add discovery.config.js
git commit -m "feat: configure discovery.config.js for B2B buyer-portal plugin"
```

---

## Task 4: Remove demo content and confirm minimal `src/`

**Files:**
- Modify: `src/` (verify only default `themes/custom-theme.scss` and `fonts/WebFonts.tsx` remain)

**Interfaces:**
- Consumes: `src/` tree from Task 1 scaffold (already minimal — official scaffold has no demo `ProductDetails`-style component, unlike the stale local `starter.store` clone).
- Produces: confirmation that no demo/example component was introduced.

- [ ] **Step 1: List `src/` contents**

```bash
find ~/repositories/b2b.store/src -type f
```

Expected: exactly `src/themes/custom-theme.scss` and `src/fonts/WebFonts.tsx` — no components directory, no demo sections file. If a demo component exists, delete it now.

- [ ] **Step 2: Commit (only if something was deleted)**

```bash
cd ~/repositories/b2b.store
git add -A
git commit -m "chore: remove demo content from src/" --allow-empty
```

---

## Task 5: Write the README (setup, prerequisites, limitations)

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing from prior tasks besides their existence (documents the finished template).
- Produces: the single source of truth a new engineer reads before provisioning a test store — required deliverable per ticket B2BTEAM-3645 acceptance criteria.

- [ ] **Step 1: Replace `README.md` content**

```markdown
# b2b.store

A FastStore B2B template — the official `starter.store` base plus the
[`@vtex/faststore-plugin-buyer-portal`](https://github.com/vtex/faststore-plugin-buyer-portal)
plugin and the VTEX B2B guideline configuration pre-wired in.

Built from ticket **B2BTEAM-3645**. Status: **beta / partial validation** —
see [Known limitations](#known-limitations) below.

## What's included

- `@faststore/cli` `^4.4.0`, `@vtex/faststore-plugin-buyer-portal` `^2.0.9`
- `discovery.config.js` with the plugin registered and B2B-oriented defaults
  (`hideUnavailableItems: true`, `enableFaststoreMyAccount: true`)
- Cypress test scripts wired to the plugin's own test suite (`yarn test-plugin`)

## What's NOT included (by design — kept lean)

- No monorepo / FastCheckout packages. If your project needs FastCheckout in
  the same repo, see the "Monorepo + FastCheckout" section below for the
  `nohoist` workaround from the internal guideline (v1.4) — apply it manually.
- No CMS content (`cms/` folder), no custom `src/` overrides beyond the
  framework defaults (`themes/`, `fonts/`) — add your store's own sections,
  components, and theme tokens in `src/` per `AGENTS.md`.

## Setup

1. Replace every `{ACCOUNT_NAME}` placeholder in `discovery.config.js` with
   your target VTEX account name (used for `storeUrl`, `secureSubdomain`,
   `checkoutUrl`, `loginUrl`, `accountUrl`) and your account's `.myvtex.com`
   domain (used for `vtexHeadlessCms.webhookUrls` — this one is NOT the
   storefront domain).
2. Install dependencies: `yarn install`
3. Run locally: `yarn dev` (http://localhost:3000)
4. Production build: `yarn build`

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
- FastCheckout — only supported in the US region (Commercial Policy) today
- Masterdata: the `addressType` field must be searchable/indexable on the `AD`
  table
- Contract Management admin permissions (View/Edit Contracts)

## Monorepo + FastCheckout (optional, not built into this template)

If your project also needs FastCheckout in the same repo
(`packages/discovery` + `packages/checkout`), apply this workaround from the
internal B2B guideline manually:

Root `package.json`:
```json
"workspaces": {
  "packages": ["packages/*"],
  "nohoist": [
    "**/@vtex/faststore-plugin-buyer-portal",
    "**/@vtex/faststore-plugin-buyer-portal/**"
  ]
}
```

This is a temporary workaround — remove it once FastStore natively supports
this monorepo scenario.

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
- **Not validated against a live VTEX B2B account** — build success (see
  below) only confirms the config/dependency graph resolves and compiles; it
  does not confirm the Buyer Portal plugin behaves correctly against a real
  account, since that requires the account prerequisites above to be in
  place first.
- **Never commit `secrets.hidden.json` / `secrets.revealed.json`** — both are
  excluded in `.gitignore`. A sibling reference repo currently has
  `secrets.hidden.json` tracked in git; do not repeat that mistake here.
- This template does not include FastCheckout, CMS content, or any
  account-specific `src/` customization — see "What's NOT included" above.

## Docs

- [FastStore documentation](https://developers.vtex.com/docs/guides/faststore)
- Ticket: B2BTEAM-3645
```

- [ ] **Step 2: Commit**

```bash
cd ~/repositories/b2b.store
git add README.md
git commit -m "docs: document B2B setup, account prerequisites, and known limitations"
```

---

## Task 6: Update `.gitignore` to exclude secrets files, install dependencies, and produce build evidence

**Files:**
- Modify: `.gitignore`
- Test: full `yarn install` + `yarn build` run (this is the acceptance test for the whole template)

**Interfaces:**
- Consumes: the complete file set from Tasks 1–5.
- Produces: a working `node_modules/`, a successful production build, and captured console output as the ticket's build-evidence deliverable.

- [ ] **Step 1: Append secrets exclusions to `.gitignore`**

Add these two lines to the end of the existing `.gitignore` (do not remove anything already there):

```
# secrets — never commit account credentials
secrets.hidden.json
secrets.revealed.json
```

- [ ] **Step 2: Install dependencies**

```bash
cd ~/repositories/b2b.store
yarn install 2>&1 | tee /tmp/b2b-store-install.log
```

Expected: exits 0, no `error` lines referencing `@vtex/faststore-plugin-buyer-portal` or `@faststore/cli` resolution failures.

- [ ] **Step 3: Run the production build and capture evidence**

```bash
cd ~/repositories/b2b.store
yarn build 2>&1 | tee /tmp/b2b-store-build.log
echo "Exit code: $?"
```

Expected: `Exit code: 0`. If it fails, capture the exact error in the plan's follow-up notes / ticket comment — a failed build is acceptable to document as a known limitation per the ticket's acceptance criteria ("não é requisito estar 100% funcional"), but the failure output itself must be recorded, not silently discarded.

- [ ] **Step 4: Commit**

```bash
cd ~/repositories/b2b.store
git add .gitignore
git commit -m "chore: exclude secrets files from version control"
```

- [ ] **Step 5: Record build evidence in the ticket**

Copy the relevant lines of `/tmp/b2b-store-build.log` (success confirmation, or the specific error if it failed) into a comment on B2BTEAM-3645, alongside a link to this repo/branch, satisfying the "Evidência de build" acceptance criterion.

---

## Self-Review Notes

- **Spec coverage:** plugin dependency (Task 2) ✓, `discovery.config.js` guideline fields (Task 3) ✓, README with prerequisites/limitations (Task 5) ✓, build evidence (Task 6) ✓, monorepo/FastCheckout workaround documented-not-built per user direction (README) ✓, secrets hygiene fix (Task 6) ✓.
- **Explicitly out of scope per user/ticket direction:** `faststore-cloud` onboarding changes, `myAccount`/`SelfManagementRouter`/`pages/pvt`/`components/overrides` (confirmed not template-relevant), CMS content, FastCheckout implementation.

---

## Addendum (2026-07-15): Monorepo + FastCheckout pivot

**Why:** after the single-package template above shipped, Cleber Alves (EM,
B2B Enabler) and the ticket owner discussed FastCheckout support directly in
Slack and decided the template should ship with FastCheckout included by
default rather than as a documented manual workaround — reasoning: "é melhor
ter e não precisar do que precisar e não ter" (better to have it and not need
it than need it and not have it), with validation with product (Petrus)
pending. This reverses this plan's original Architecture decision (single
package, FastCheckout as optional documented extension).

**What changed, mechanically:**
1. Ran the official `@vtex/fsp-cli` migration instead of hand-rolling the
   monorepo structure: `fsp init --from-discovery` (moves the existing
   single-package template into `packages/discovery`, generates root
   `package.json` + `turbo.json` + `faststore.json`), then
   `fsp create {ACCOUNT_NAME} checkout packages/checkout` (scaffolds the
   FastCheckout module via `@vtex/checkout`'s `defineExtensions`).
2. Manually re-added the `nohoist` entry for
   `@vtex/faststore-plugin-buyer-portal` to root `package.json` — `fsp init`
   does not add this itself; it's the same guideline v1.4 workaround this
   plan originally described as a manual, optional step.
3. Manually pinned `packageManager` to the full yarn hash (the CLI only wrote
   the bare version) for consistency with the rest of the template.
4. Removed the demo `HelloWorld` extension `fsp create` scaffolds by default,
   replacing `packages/checkout/src/index.tsx` with an empty
   `defineExtensions({})` — same "no demo content" constraint as the original
   Task 4.
5. Relocated `docs/` and `.superpowers/` back to the repo root (the migration
   moved everything not explicitly kept into `packages/discovery`); moved the
   main `README.md` to repo root (now documents the whole monorepo, not just
   discovery) and left a one-line pointer README in `packages/discovery`.
6. Rewrote `README.md` throughout: "What's included"/"What's NOT included",
   Setup steps (per-package ports 3001/3002, root-level `yarn dev`/`yarn
   build` via Turborepo), a new "Monorepo structure" section replacing the
   old "Monorepo + FastCheckout (optional, not built)" section, and two new
   Known Limitations bullets (FastCheckout unvalidated against a real
   account; the `fsp init --from-discovery` account-name auto-detection
   gotcha, below).

**New gotcha found during migration (important — document, don't silently
fix):** `fsp init --from-discovery` reads the locally logged-in VTEX account
via VTEX Toolbelt and can silently overwrite the `{ACCOUNT_NAME}` placeholder
in `discovery.config.js` (`api.storeId`) and `faststore.json` (the `stores`
key) with that real, machine-local account name instead of preserving the
placeholder. This was caught in a disposable scratch-copy test run before
touching the real repo — always verify both files still say `{ACCOUNT_NAME}`
after running this migration, on any machine.

**Not re-litigated:** the original Task 1–6 single-package work is not
reverted or invalidated — this addendum documents the structural migration
applied on top of it, on the same branch, informed by a real product/eng
decision made after the original plan was written.

**Three real dependency-hoisting bugs found and fixed via `yarn build`
verification, all independent of the `{ACCOUNT_NAME}` placeholder issue (in
order of discovery):**

1. `next build --webpack: error: unknown option '--webpack'` — root cause:
   `@vtex/checkout` pulls in `@vtex/checkout-ui-core`, which bundles its own
   Next.js 14; yarn hoisted THAT `next` binary to the workspace root
   `node_modules/.bin/next`, shadowing the Next.js 16 that
   `@faststore/cli`/`@faststore/core` require. Fixed by adding
   `**/@vtex/checkout-ui-core` + `**/@vtex/checkout-ui-core/**` to root
   `package.json`'s `nohoist`.
2. `Cannot find module 'autoprefixer'` — root cause: `@faststore/core` needs
   `autoprefixer ^10`, but `@vtex/sales-app`'s transitive dependency
   `draftjs-to-html` needs `^9`; the conflict left yarn unable to hoist
   either copy to root. Fixed with `resolutions.autoprefixer: "^10.4.0"`
   *and* an explicit `autoprefixer` root `devDependency` — the resolutions
   pin alone did not make yarn hoist a copy to root; an explicit top-level
   dependency was required in addition.
3. `TypeError: Cannot read properties of null (reading 'useEffect')` during
   static prerendering of an unrelated page (`/password-protection`) — root
   cause: even after pinning `resolutions.react`/`resolutions.react-dom` to
   `^18.3.1`, yarn classic still physically duplicated React under
   `packages/discovery/node_modules` (identical version, but a second module
   instance — enough to break React's internals when two copies render in
   the same tree). Fixed with a root `postinstall` script:
   `rm -rf packages/discovery/node_modules/react packages/discovery/node_modules/react-dom`
   — Node's module resolution then walks up to the single deduped copy at
   the workspace root.

After all three fixes, `yarn build` reaches the exact same class of failure
as the original single-package build: an account-dependent page (observed on
`/checkout`, `/404`, and `/500` across different runs — not deterministically
the same page, since which page a build worker reaches first varies) fails
prerendering with HTTP 400 against the unresolved `{ACCOUNT_NAME}` placeholder
domain. This confirms the monorepo + FastCheckout integration itself is
sound; the only remaining failure is the same pre-existing, accepted,
documented limitation from the original plan (needs a real provisioned VTEX
account to fully build).
