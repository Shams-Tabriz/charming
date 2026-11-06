// Your products. These are SAMPLE items: replace them with your real ones.
//
// Fields:
//   id          unique, no spaces (e.g. "pearl-bow-necklace")
//   name        product name
//   category    any name you like. Each new name becomes its own section on the
//               shop page, in the order it first appears in this file.
//               Rename it or stop using it and the section changes or disappears.
//   price       number only (no currency symbol)
//   image       path to photo, e.g. "assets/products/pearl-necklace.jpg"
//               leave "" to show a pretty placeholder
//   description short text
//   options     optional list of choices (colors, sizes), e.g. ["Pink", "Cream"]
//   badge       optional label, e.g. "New" or "Best seller"
//   soldOut     true to disable ordering
window.PRODUCTS = [
  // Jewelry
  { id: "pearl-bow-necklace", name: "Pearl Bow Necklace", category: "Jewelry", price: 199, image: "",
    description: "A dainty pearl chain with a little ribbon charm. Pairs with everything.",
    options: ["Gold", "Silver"], badge: "New" },
  { id: "heart-hoop-earrings", name: "Heart Hoop Earrings", category: "Jewelry", price: 149, image: "",
    description: "Lightweight hoops with tiny heart charms. Comfortable for all-day wear." },
  { id: "charm-bracelet", name: "Dainty Charm Bracelet", category: "Jewelry", price: 169, image: "",
    description: "Adjustable chain bracelet with sweet little charms.", options: ["Gold", "Silver"] },
  { id: "ribbon-ring-set", name: "Ribbon Ring Set", category: "Jewelry", price: 129, image: "",
    description: "Set of 3 stackable rings. Adjustable size.", badge: "Best seller" },

  // Bags
  { id: "cream-mini-handbag", name: "Cream Mini Handbag", category: "Bags", price: 899, image: "",
    description: "Structured mini handbag with gold details and a detachable strap.",
    options: ["Cream", "Blush"] },
  { id: "pastel-crossbody", name: "Pastel Crossbody", category: "Bags", price: 649, image: "",
    description: "Small crossbody that fits your phone, cards and lip balm.",
    options: ["Blush", "Baby Blue", "Cream"] },
  { id: "bow-tote", name: "Bow Tote Bag", category: "Bags", price: 749, image: "",
    description: "Roomy everyday tote with a cute bow accent." },

  // Wallets
  { id: "blush-zip-wallet", name: "Blush Zip Wallet", category: "Wallets", price: 349, image: "",
    description: "Slim zip-around wallet with card slots and a coin pocket.",
    options: ["Blush", "Cream"] },
  { id: "heart-coin-purse", name: "Heart Coin Purse", category: "Wallets", price: 199, image: "",
    description: "Heart-shaped mini purse for coins, earbuds and small treasures." },
  { id: "card-holder", name: "Bow Card Holder", category: "Wallets", price: 249, image: "",
    description: "Compact cardholder that slips into any bag.", soldOut: true },

  // Hand Fans
  { id: "mini-fan-blue", name: "Mini Handheld Fan", category: "Hand Fans", price: 299, image: "",
    description: "Rechargeable pocket fan. Quiet, cool and cute.",
    options: ["Baby Blue", "Blush Pink"], badge: "Best seller" },
  { id: "heart-fan", name: "Heart Handheld Fan", category: "Hand Fans", price: 329, image: "",
    description: "Heart-shaped fan with a soft-touch finish." },
  { id: "floral-folding-fan", name: "Floral Folding Fan", category: "Hand Fans", price: 99, image: "",
    description: "Pretty foldable fan. Easy to carry, perfect for hot days." }
];
