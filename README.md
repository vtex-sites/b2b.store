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
- **Not validated against a live VTEX B2B account** — `yarn build` currently fails in the default state: TypeScript and webpack compile successfully, but prerendering `/checkout` fails with HTTP 400 because the `{ACCOUNT_NAME}` placeholder cannot resolve a real backend. Replacing this placeholder with a provisioned VTEX account (per Setup above) is expected to resolve this. The failure does not confirm whether Buyer Portal behaves correctly against a real account — that requires the prerequisites above.
- **Never commit `secrets.hidden.json` / `secrets.revealed.json`** — both are
  excluded in `.gitignore`. A sibling reference repo currently has
  `secrets.hidden.json` tracked in git; do not repeat that mistake here.
- This template does not include FastCheckout, CMS content, or any
  account-specific `src/` customization — see "What's NOT included" above.

## Docs

- [FastStore documentation](https://developers.vtex.com/docs/guides/faststore)
- Ticket: B2BTEAM-3645
