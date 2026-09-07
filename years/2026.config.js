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

  /* Full ISO 8601 with timezone. +05:30 = India Standard Time.
     Doors open 7:30am; the fair runs all day. */
  eventDate: "2026-11-22T07:30:00+05:30",

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
    opensOn: "2026-11-01T00:00:00+05:30",   // first Sunday of November
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
      text: "Screenings in the Basement and the AV room. Book a slot online, show your code at the door." }
  ],

  causes: [
    { icon: "cap",   title: "Education & Scholarships",
      text: "School fees, books and exam costs for students who’d otherwise drop out, including children from single-parent and hardworking families.",
      stat: "₹34,300 given last year" },
    { icon: "heart", title: "Medical Emergency Fund",
      text: "Fast, no-questions help when a family is hit with a sudden hospital bill.",
      stat: "₹10,000 given last year" },
    { icon: "hands", title: "Hardship Support",
      text: "Rent, groceries and essentials for neighbours going through a hard stretch." }
  ],

  causeImpactTotal: "₹44,300",
  causeNote: "That's ₹34,300 towards school and exam costs, and ₹10,000 towards a heart operation. No names, no fuss: just money that reached people who needed it, put to use last year.",

  /* This is a standing yearly commitment, not a one-off — keep the
     wording in the present tense / "every year", not "last year". */
  causeActivitiesEyebrow: "Every year, beyond the fundraiser",
  causeActivities: "Food donation drives, medical camps, and visits to local orphanages are run every year — not just funded by Vimusement, but organised by the same group, year after year.",

  /* Home-page impact strip (the #why section). Numbers count up when
     scrolled into view. Set `text` instead of `n` for a non-numeric
     stat. `hide: true` skips one. */
  impact: {
    stats: [
      { n: 44300, prefix: "₹", label: "given to education and medical support last year" },
      { n: 100, suffix: "%", label: "of what’s raised, after event costs, goes to the cause" },
      { n: 3,               label: "funds it feeds: scholarships, medical emergencies, hardship" },
      { text: "₹0",         label: "in payment fees. You pay the parish directly by UPI" }
    ]
  },

  involve: [
    { theme: "games",  icon: "hands", title: "Volunteer",
      text: "Give a few hours on the gates, the stalls, the food street or clean-up. Shifts as short as two hours. Message Austin on WhatsApp and we’ll find you a slot.",
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
    /* "What your gift does" — shown live under the amount as you pick.
       First row whose `upTo` the amount is at or below wins; the last
       row is the catch-all. Keep them concrete and in the parish's terms. */
    funds: [
      { upTo: 350,       text: "a week of groceries for a family having a hard month" },
      { upTo: 800,       text: "exam fees and a set of textbooks for one student" },
      { upTo: 1800,      text: "a term of school fees for a child who might have dropped out" },
      { upTo: 6000,      text: "a real dent in a hospital bill a family can't meet alone" },
      { upTo: Infinity,  text: "a full term of support for a student, or an emergency met the same day" }
    ],
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
    /* The shape of the day. Shown as a ribbon on the Programme page, with a
       live "you are here" marker during the fair itself. Times are "HH:MM"
       (24h, local). Adjust once the running order is set. */
    timeline: [
      { at: "07:30", label: "Doors open",       note: "Breakfast, food stalls, games and craft tables" },
      { at: "10:00", label: "Screenings begin", note: "Basement and AV room, running through the day" },
      { at: "18:00", label: "Evening mass",     note: "In the church" },
      { at: "19:30", label: "Lucky draw",       note: "Drawn live on stage, right after mass" },
      { at: "21:00", label: "Screenings close", note: "The last films wrap up" }
    ],
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
      { name: "Housie / Tambola",     venue: "Center of Attraction" },
      { name: "Carrom challenge",     venue: "Center of Attraction" },
      { name: "Ring toss",            venue: "Center of Attraction" },
      { name: "Hoopla",               venue: "Center of Attraction" },
      { name: "Dart the balloon",     venue: "Center of Attraction" },
      { name: "Lucky dip",            venue: "Center of Attraction" },
      { name: "Bottle knock-down",    venue: "Center of Attraction" },
      { name: "Guess the jar",        venue: "Center of Attraction" }
    ]
  },

  /* ---------- VENUE MAP  (the grounds plan on the Programme page) ----------
     The plan is drawn in modules/venuemap.js, traced from the committee's
     layout sketch: 27 numbered stalls (1–27, sequential) around the
     Center of Attraction, the church block up top, the AV Room beside
     stalls 17–20, Food Counter, Entry at the foot.

     zones[]  — the named (non-stall) areas. `id` must match a data-zone in
                the SVG; `venue` is matched against program[].venue above.
     stalls   — fill a number in as it's assigned, e.g.
                  "12": { for: "Home bakes & preserves", by: "St. Anne's Guild" }
                anything not listed shows "Not assigned yet". */
  venueMap: {
    planImage: "",
    caption: "Tap a spot on the plan to see what’s there. Stalls are still being assigned.",
    zones: [
      { id: "entry",    label: "Entry", venue: "Gate",
        blurb: "Come in here." },
      { id: "center",   label: "Center of Attraction", venue: "Center of Attraction",
        blurb: "The main stage and the open games area. Live through the day, and the lucky draw is called here after mass." },
      { id: "food",     label: "Food Counter", venue: "Food Street",
        blurb: "Breakfast from 7:30, then snacks and meals all day. Cashless UPI." },
      { id: "basement", label: "Basement", venue: "Basement",
        blurb: "Movie screenings from 10am. Stairs by the side door." },
      { id: "av",       label: "AV Room", venue: "AV Room",
        blurb: "More screenings, on the third floor above stalls 17–20. Follow the signs." },
      { id: "church",   label: "Church", venue: "Church",
        blurb: "Evening mass at 6. Open through the day for a quiet moment." },
      { id: "chapel",   label: "Chapel", venue: "Chapel",
        blurb: "A quiet side chapel, open all day." },
      { id: "tickets",  label: "Gifts & tickets", venue: "Gifts",
        blurb: "Lucky-draw tickets, event tees and the Victorians Youth table. Game tokens are handed out here too." }
    ],
    stalls: {
      // "1": { for: "", by: "" },
    }
  }
};
