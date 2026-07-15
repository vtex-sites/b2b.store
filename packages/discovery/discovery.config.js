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
