/* ============================================================
   VIMUSEMENT 2026 — year content
   -----------------------------------------------------------
   To run a new year:
     1. Copy this file to  years/2027.config.js
     2. Change the "2026" key below to "2027" and edit content
     3. Point  years/current.js  at the new year
   Everything on the pages is generated from this object.
   ============================================================ */
window.VIM_YEARS = window.VIM_YEARS || {};

window.VIM_YEARS["2026"] = {
  year: 2026,

  /* The Apps Script Web App /exec URL — ONE backend for donations,
     lucky draw and (later) movies. See apps-script/Code.gs. */
  api: "https://script.google.com/macros/s/AKfycbzA0T3Ccp2OjNS6WUXACM1G7UPT10lMZ4hVOiLGYihmDdN_OjvbHghkZRoO9DSrJijH/exec",

  /* Full ISO 8601 with timezone. +05:30 = India Standard Time. PLACEHOLDER. */
  eventDate: "2026-12-19T17:30:00+05:30",

  venue: {
    name: "Ascension Church, Aminjikkarai",
    address: "Ascension Church, 26 Railway Colony 4th Street, Aminjikkarai, Chennai, Tamil Nadu",
    mapQuery: "Ascension Church, Railway Colony 4th Street, Aminjikkarai, Chennai",
    quote: "See you there.",
    mapUrl: ""                      // optional — overrides the auto Google Maps link
  },

  contactEmail: "",                 // e.g. "vimusement@yourparish.org"  ("" hides the link)
  donateUrl: "",                    // leave "" — the Donate links point to donate.html (see donation{} below)

  /* Banner reveal — the community mosaic on the home page.
     It stays hidden until `opensOn`, then wakes up on its own: the section
     appears and visitors can tap tiles to help fill in the banner.
     - live:    force it on now (for a look before the date). Normally false.
     - opensOn: the moment it turns itself on. Full ISO 8601 with timezone.
     - goalTaps: tiles the community places together before it's "complete".
     Preview it any time with  ?reveal=preview  on the URL. */
  reveal: {
    live: false,
    opensOn: "2026-12-19T00:00:00+05:30",
    goalTaps: 500
  },

  /* Where the three "Get Involved" buttons go. Any URL works — a page
     on this site, a WhatsApp link, a Google Form. Blank falls back to a
     pre-filled email to contactEmail. */
  forms: {
    // Volunteer → WhatsApp Austin directly (India +91). NOTE: this number
    // is published on the public site.
    volunteer: "https://wa.me/916379468686?text=Hi%20Austin%2C%20I%27d%20like%20to%20volunteer%20for%20Vimusement%202026.",
    // Sponsor → the donate page.
    sponsor: "donate.html",
    // Run a stall → the stalls page (list + prices, still being finalised).
    stall: "stalls.html"
  },

  /* -------- IMAGES (per-year folder: assets/img/2026/) --------
     Drop files in that folder and point these at them.
     Leave "" to show a tasteful placeholder. */
  images: {
    heroPhoto: "",                  // assets/img/2026/hero.jpg  — church grounds at dusk
    ogImage:   "assets/img/shared/og-default.png",

    /* GALLERY — three modes (photos AND videos/reels both work):

       "widget" → whole recent Instagram feed, auto-updating. Connect the
                  account once at behold.so (free), paste the snippet into
                  widgetHtml. Video shows a play button → opens a lightbox.

       "embed"  → hand-picked posts/reels via Instagram's OFFICIAL embed.
                  Reels play INLINE with sound. Add URLs to posts[] after
                  each event. No third-party service.

       "local"  → your own files, listed in items[] (assets/img/2026/).

       Set social.instagram in assets/js/site.config.js either way. */
    gallery: {
      /* "reels"  → a styled poster wall; each card opens the reel in a
                    dark lightbox (our design, not Instagram's card).
         "widget" → whole feed via a behold.so snippet in widgetHtml.
         "embed"  → raw official Instagram embeds (posts[]).
         "local"  → your own files (items[]). */
      source: "reels",

      // Each reel:
      //   url    – Instagram link. Plays in the lightbox via Instagram's player
      //            (their branding; tapping it can bounce to instagram.com).
      //   video  – a local .mp4 (download your own reel and drop it in
      //            assets/img/2026/). Plays in a plain player, 100% on this
      //            site, no Instagram. RECOMMENDED. Overrides url.
      //   poster – cover image (optional). Without one, an illustrated
      //            fairground card with the year is drawn.
      reels: [
        { year: "2025", url: "https://www.instagram.com/p/DS6jdUXk9mh/", video: "", poster: "" },
        { year: "2024", url: "https://www.instagram.com/p/DCqXczaNbkG/", video: "", poster: "" },
        { year: "2023", url: "https://www.instagram.com/p/CyijLOeSPm4/", video: "", poster: "" },
        { year: "2022", url: "https://www.instagram.com/p/Cg__sOBJMpV/", video: "", poster: "" }
      ],

      widgetHtml: "",
      posts: [],
      items: []
    }
  },

  /* The people who make it happen — a carousel of memories + a thank-you line.
     Add photos to assets/img/2026/ and list them here. */
  crew: {
    /* Files live in assets/img/2026/crew/ , zero-padded so they sort in order.
       Add/remove/reorder freely — the carousel follows this list. */
    photos: [
      { src: "assets/img/2026/crew/crew-01.jpg", alt: "The team at the parish hall" },
      { src: "assets/img/2026/crew/crew-02.jpg", alt: "Full group on the church steps with Father" },
      { src: "assets/img/2026/crew/crew-03.jpg", alt: "Feast-night stage, the flower heart on the steps" },
      { src: "assets/img/2026/crew/crew-04.jpg", alt: "Gathered in the chapel with the Bishop" },
      { src: "assets/img/2026/crew/crew-05.jpg", alt: "Pilgrimage outing to the shrine" },
      { src: "assets/img/2026/crew/crew-06.jpg", alt: "Victorians Youth on the church steps" },
      { src: "assets/img/2026/crew/crew-07.jpg", alt: "The performance team before going on" }
    ],
    caption: "Made possible by the Victorians Youth and the parish volunteers."
  },

  /* -------- CONTENT -------- */
  marquee: ["Carnival Games", "Movie Screenings", "Food Street", "Games Stalls",
            "Live Music", "Lucky Dip", "Cake Stall", "Snack Bar"],

  whatsOn: [
    { theme: "games",  icon: "games", title: "Games & Stalls",
      text: "Ring toss, hoopla and stalls that pay out in giggles. Buy tokens at the gate." },
    { theme: "food",   icon: "food",  title: "Food Street",
      text: "Home kitchens and local vendors, from biryani to candy floss. Cashless UPI at every stall." },
    { theme: "movies", icon: "movie", title: "Movie Screenings",
      text: "Screenings in the Basement and the AV room. Book a slot online, show your code at the door." },
    { theme: "kids",   icon: "kids",  title: "Kids’ Corner",
      text: "Craft tables and a story corner. A shaded spot for the little ones." }
  ],

  causes: [
    { icon: "cap",   title: "Education & Scholarships",
      text: "School fees, books and exam costs for students who’d otherwise drop out." },
    { icon: "heart", title: "Medical Emergency Fund",
      text: "Fast, no-questions help when a family is hit with a sudden hospital bill." },
    { icon: "hands", title: "Hardship Support",
      text: "Rent, groceries and essentials for neighbours going through a hard stretch." }
  ],

  causeNote: "// Last year’s figures and disbursements will be published on the Impact page.",

  /* Home-page impact strip (the #why section). Numbers count up when
     scrolled into view. Add last year's total once you have it:
       { n: 420000, prefix: "₹", label: "raised last year for the cause" }
     Set `text` instead of `n` for a non-numeric stat. `hide: true` skips one. */
  impact: {
    stats: [
      { n: 100, suffix: "%", label: "of what’s raised, after event costs, goes to the cause" },
      { n: 3,               label: "funds it feeds: scholarships, medical emergencies, hardship" },
      { text: "₹0",         label: "in payment fees. You pay the parish directly by UPI" }
    ]
  },

  involve: [
    { theme: "kids",   icon: "hands", title: "Volunteer",
      text: "Give an evening on the gates, stalls, kids’ corner or clean-up. Shifts as short as two hours. Message Austin on WhatsApp and we’ll find you a slot.",
      cta: "Message Austin on WhatsApp", form: "volunteer" },
    { theme: "movies", icon: "star",  title: "Sponsor",
      text: "Back the fair as a business or a family. Your name goes on the site and the screens, and a sponsorship is a donation to the same cause.",
      cta: "Become a sponsor", form: "sponsor" },
    { theme: "food",   icon: "stall", title: "Run a Stall",
      text: "Food, games or crafts. Bring a stall and share the takings with the cause, then see what’s open and the table rates.",
      cta: "See stalls & rates", form: "stall" }
  ],

  /* ---------- STALLS  (the stalls.html page) ----------
     Fill `open[]` with the stalls still available and set the table
     `rates` when the committee decides. The page renders whatever is here. */
  stalls: {
    intro: "Bring a stall to Vimusement: food, a game or a craft table. You keep it running on the night and share the takings with the cause.",
    ratesNote: "Table rates are being finalised. Message to reserve a spot now.",
    rates: [
      // { name: "Food stall (own gas/electric)", price: "TBC" },
      // { name: "Game or craft table",           price: "TBC" }
    ],
    open: [
      // "Snack stall", "Craft table", "Game booth"
    ],
    contactWhatsApp: "https://wa.me/916379468686?text=Hi%20Austin%2C%20I%27d%20like%20to%20run%20a%20stall%20at%20Vimusement%202026.",
    contactInstagram: "https://ig.me/m/victorians.youth"
  },

  /* ---------- DONATIONS ----------
     Zero-fee UPI. The donor pays straight to the parish UPI id; a
     volunteer confirms it in the Master sheet; the Apps Script then
     emails the donor and adds their name to the supporters wall.
     Backend + UPI id live in Apps Script (see apps-script/Code.gs +
     docs/donations-setup.md). Amounts are never shown publicly. */
  donation: {
    presets: [250, 500, 1000, 2500, 5000, 10000],
    default: 500,
    minAmount: 10,
    wallByDefault: true,     // pre-tick "show my name on the wall"
    confirmWithinText: "usually within a day",
    showTotal: false,        // show the running total raised (aggregate, not per-person)
    goal: 0,                 // ₹ target for the thermometer (0 = hide the bar)
    scrollerHint: "Amounts are never shown. Every gift counts the same."
  },

  /* ---------- LUCKY DRAW ----------
     Digital tickets. Buy online (UPI) or at a cash counter; a unique
     number is generated by the backend and emailed to the buyer.
     Ticket price is set in Apps Script (LD_PRICE); shown here for copy. */
  luckyDraw: {
    enabled: true,
    price: 50,               // display only — the real price is LD_PRICE in Apps Script
    maxOnline: 25,
    confirmWithinText: "usually within a day",
    prizes: [
      { place: "1st prize", detail: "" },
      { place: "2nd prize", detail: "" },
      { place: "3rd prize", detail: "" }
    ],
    blurb: "Every ticket is a number in the hat and a gift to the cause. Winners are drawn live on stage on the night."
  },

  /* ---------- PROGRAM  (screenings + games, by venue) ----------
     `venue` must match a venueMap.zones[].venue string below.
     Give a screening a `title` and `time` and it shows in the line-up;
     leave them blank and the page just shows the count per room until
     the committee locks the line-up. ~9 screenings across the two rooms. */
  program: {
    screeningsNote: "Nine films across the Basement and the AV room. The full line-up and times are announced closer to the date.",
    screenings: [
      { title: "", time: "", venue: "Basement", rating: "" },
      { title: "", time: "", venue: "Basement", rating: "" },
      { title: "", time: "", venue: "Basement", rating: "" },
      { title: "", time: "", venue: "Basement", rating: "" },
      { title: "", time: "", venue: "AV Room",  rating: "" },
      { title: "", time: "", venue: "AV Room",  rating: "" },
      { title: "", time: "", venue: "AV Room",  rating: "" },
      { title: "", time: "", venue: "AV Room",  rating: "" },
      { title: "", time: "", venue: "AV Room",  rating: "" }
    ],
    games: [
      { name: "Housie / Tambola",     venue: "Basement" },
      { name: "Carrom challenge",     venue: "AV Room" },
      { name: "Ring toss",            venue: "Church Grounds" },
      { name: "Hoopla",               venue: "Church Grounds" },
      { name: "Dart the balloon",     venue: "Church Grounds" },
      { name: "Lucky dip",            venue: "Church Grounds" },
      { name: "Bottle knock-down",    venue: "Stall Row A" },
      { name: "Guess the jar",        venue: "Stall Row B" }
    ]
  },

  /* ---------- VENUE MAP  (the on-site plan in #map) ----------
     Each zone.id must match a data-zone in the plan SVG. Leave
     planImage "" to use the built-in placeholder plan; set it to a
     traced SVG (keeping the same data-zone ids) when the real layout
     is drawn. zone.venue is matched against program[].venue above. */
  venueMap: {
    planImage: "",
    caption: "Tap a spot on the plan to see what’s there.",
    zones: [
      { id: "gate",     label: "Entry & Tokens", venue: "Gate",
        blurb: "Buy game tokens and lucky-draw tickets here. Step-free access on the left." },
      { id: "grounds",  label: "Church Grounds", venue: "Church Grounds",
        blurb: "Open-air games and the main stage. The live lucky draw happens here." },
      { id: "food",     label: "Food Street", venue: "Food Street",
        blurb: "Home kitchens and local vendors. Cashless UPI at every stall." },
      { id: "stalls-a", label: "Stall Row A", venue: "Stall Row A",
        blurb: "Craft and game stalls run by families and youth groups." },
      { id: "stalls-b", label: "Stall Row B", venue: "Stall Row B",
        blurb: "More stalls. Want a table? See “Run a Stall” under Get Involved." },
      { id: "basement", label: "Basement", venue: "Basement",
        blurb: "Movie screenings and indoor games. Stairs by the side door." },
      { id: "av",       label: "AV Room", venue: "AV Room",
        blurb: "More screenings and indoor games, on the first floor. Follow the signs." },
      { id: "kids",     label: "Kids’ Corner", venue: "Kids’ Corner",
        blurb: "Craft tables and a story corner. Shaded and supervised." }
    ]
  }
};
