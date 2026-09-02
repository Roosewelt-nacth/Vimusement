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

  /* Banner-reveal (interactive counter opens near the date) */
  reveal: {
    goalTaps: 500,
    teaserPercent: 62               // the demo bar fill shown before it's live
  },

  /* Forms — paste URLs (Google Forms / Formspree / etc).
     Blank falls back to a pre-filled email to contactEmail. */
  forms: {
    volunteer: "",
    sponsor: "",
    stall: ""
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
      { src: "assets/img/2026/crew/crew-03.jpg", alt: "Feast-night stage — the flower heart on the steps" },
      { src: "assets/img/2026/crew/crew-04.jpg", alt: "Gathered in the chapel with the Bishop" },
      { src: "assets/img/2026/crew/crew-05.jpg", alt: "Pilgrimage outing to the shrine" },
      { src: "assets/img/2026/crew/crew-06.jpg", alt: "Victorians Youth on the church steps" },
      { src: "assets/img/2026/crew/crew-07.jpg", alt: "The performance team before going on" }
    ],
    caption: "Made possible by the Victorians Youth and the parish volunteers."
  },

  /* -------- CONTENT -------- */
  marquee: ["Carnival Games", "Open-Air Cinema", "Food Street", "Kids’ Zone",
            "Live Music", "Lucky Dip", "Cake Stall", "Face Painting"],

  whatsOn: [
    { theme: "games",  icon: "games", title: "Games & Rides",
      text: "Ring toss, hoopla and stalls that pay out in giggles. Buy tokens at the gate." },
    { theme: "food",   icon: "food",  title: "Food Street",
      text: "Home kitchens and local vendors — biryani to candy floss. Cashless UPI at every stall." },
    { theme: "movies", icon: "movie", title: "Open-Air Cinema",
      text: "Two screenings under the stars. Book a slot online, show your code at the lawn." },
    { theme: "kids",   icon: "kids",  title: "Kids’ Zone",
      text: "Face painting, craft tables and a story corner — a safe, shaded spot for the little ones." }
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

  involve: [
    { theme: "kids",   icon: "hands", title: "Volunteer",
      text: "Give an evening — gates, stalls, kids’ zone, clean-up. Shifts as short as two hours.",
      cta: "Sign up to help", form: "volunteer" },
    { theme: "movies", icon: "star",  title: "Sponsor",
      text: "Back the fair as a business or a family. Your name on the site and the screens.",
      cta: "Become a sponsor", form: "sponsor" },
    { theme: "food",   icon: "stall", title: "Run a Stall",
      text: "Food, games or crafts — bring a stall and share the takings with the cause.",
      cta: "Reach out about a stall", form: "stall" }
  ],

  /* ---------- DONATIONS ----------
     Zero-fee UPI. The donor pays straight to the parish UPI id; a
     volunteer confirms it in the Master sheet; the Apps Script then
     emails the donor and adds their name to the supporters wall.
     Backend + UPI id live in Apps Script (see apps-script/Code.gs +
     docs/donations-setup.md). Amounts are never shown publicly. */
  donation: {
    api: "https://script.google.com/macros/s/AKfycbzA0T3Ccp2OjNS6WUXACM1G7UPT10lMZ4hVOiLGYihmDdN_OjvbHghkZRoO9DSrJijH/exec",
    presets: [250, 500, 1000, 2500, 5000, 10000],
    default: 500,
    minAmount: 10,
    wallByDefault: true,     // pre-tick "show my name on the wall"
    confirmWithinText: "usually within a day",
    showTotal: false,        // show the running total raised (aggregate, not per-person)
    goal: 0,                 // ₹ target for the thermometer (0 = hide the bar)
    scrollerHint: "Amounts are never shown — every gift counts the same."
  }
};
