/* ============================================================
   VIMUSEMENT 2026 — year content
   -----------------------------------------------------------
   To run a new year:
     1. Copy this file to  years/2027.config.js
     2. Change the "2026" key below to "2027" and edit content
     3. Point  years/current.js  at the new year
   Everything on the pages is generated from this object.

   Bilingual: any display string (title/text/label/blurb/name/etc.)
   is written {en:"...", ta:"..."} and resolved by ctx.L() wherever
   it's rendered (see render.js/venuemap.js/timeline.js/crew.js).
   Fields that are matching KEYS, not display text — `venue:` on
   program.screenings/games and venueMap.zones, icon names, prices,
   URLs — stay plain strings; making those bilingual would break the
   string-equality matching that wires screenings/games to map zones.
   Tamil text drafted for review — check with a fluent reader before
   the event, especially money-related copy.
   ============================================================ */
window.VIM_YEARS = window.VIM_YEARS || {};

window.VIM_YEARS["2026"] = {
  year: 2026,

  /* The Apps Script Web App /exec URL — ONE backend for donations,
     lucky draw and (later) movies. See apps-script/Code.gs. */
  api: "https://script.google.com/macros/s/AKfycbzA0T3Ccp2OjNS6WUXACM1G7UPT10lMZ4hVOiLGYihmDdN_OjvbHghkZRoO9DSrJijH/exec",

  /* Full ISO 8601 with timezone. +05:30 = India Standard Time.
     Doors open 7:30am; the fair runs all day. */
  eventDate: "2026-10-25T07:30:00+05:30",

  venue: {
    name: "Ascension Church, Aminjikkarai",
    address: "Ascension Church, 26 Railway Colony 4th Street, Aminjikkarai, Chennai, Tamil Nadu",
    mapQuery: "Ascension Church, Railway Colony 4th Street, Aminjikkarai, Chennai",
    quote: { en: "See you there.", ta: "அங்கு சந்திப்போம்." },
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
    opensOn: "2026-10-04T00:00:00+05:30",   // three Sundays before the fair (event date moved to Oct 25)
    goalTaps: 500
  },

  /* Where the three "Get Involved" buttons go. Any URL works — a page
     on this site, a WhatsApp link, a Google Form. Blank falls back to a
     pre-filled email to contactEmail. */
  forms: {
    // Volunteer → WhatsApp Austin directly (India +91). NOTE: this number
    // is published on the public site.
    volunteer: "https://wa.me/916379468686?text=Hi%20Austin%2C%20I%27d%20like%20to%20volunteer%20for%20Vimusement%202026.",
    // Sponsor → WhatsApp Austin directly (same contact as volunteering).
    // NOTE: this number is published on the public site.
    sponsor: "https://wa.me/916379468686?text=Hi%20Austin%2C%20I%27d%20like%20to%20know%20more%20about%20sponsoring%20Vimusement%202026.",
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
      { src: "assets/img/2026/crew/crew-01.jpg", alt: { en: "The team at the parish hall", ta: "பங்கு மண்டபத்தில் குழு" } },
      { src: "assets/img/2026/crew/crew-02.jpg", alt: { en: "Full group on the church steps with Father", ta: "குருவுடன் தேவாலய படிக்கட்டுகளில் முழு குழு" } },
      { src: "assets/img/2026/crew/crew-03.jpg", alt: { en: "Feast-night stage, the flower heart on the steps", ta: "விழா இரவு மேடை, படிக்கட்டுகளில் மலர் இதயம்" } },
      { src: "assets/img/2026/crew/crew-04.jpg", alt: { en: "Gathered in the chapel with the Bishop", ta: "ஆயருடன் தேவாலயத்தில் கூடியிருத்தல்" } },
      { src: "assets/img/2026/crew/crew-05.jpg", alt: { en: "Pilgrimage outing to the shrine", ta: "திருத்தலத்திற்கு புனித யாத்திரை" } },
      { src: "assets/img/2026/crew/crew-06.jpg", alt: { en: "Victorians Youth on the church steps", ta: "தேவாலய படிக்கட்டுகளில் விக்டோரியன்ஸ் யூத்" } },
      { src: "assets/img/2026/crew/crew-07.jpg", alt: { en: "The performance team before going on", ta: "மேடை ஏறும் முன் நிகழ்ச்சிக் குழு" } }
    ],
    caption: { en: "Made possible by the Victorians Youth and the parish volunteers.",
               ta: "விக்டோரியன்ஸ் யூத் மற்றும் பங்கு தன்னார்வலர்களால் சாத்தியமானது." }
  },

  /* -------- CONTENT -------- */
  marquee: [
    { en: "Carnival Games",    ta: "கார்னிவல் விளையாட்டுகள்" },
    { en: "Movie Screenings",  ta: "திரைப்பட காட்சிகள்" },
    { en: "Food Street",       ta: "உணவு தெரு" },
    { en: "Games Stalls",      ta: "விளையாட்டு கடைகள்" },
    { en: "Live Music",        ta: "நேரடி இசை" },
    { en: "Lucky Dip",         ta: "லக்கி டிப்" },
    { en: "Cake Stall",        ta: "கேக் கடை" },
    { en: "Snack Bar",         ta: "சிற்றுண்டி கடை" }
  ],

  whatsOn: [
    { theme: "games",  icon: "games",
      title: { en: "Games & Stalls", ta: "விளையாட்டுகள் & கடைகள்" },
      text: { en: "Ring toss, hoopla and stalls that pay out in giggles. Buy tokens at the gate.",
              ta: "ரிங் டாஸ், ஹூப்லா மற்றும் சிரிப்பை பரிசாக தரும் கடைகள். வாசலில் டோக்கன் வாங்கவும்." } },
    { theme: "food",   icon: "food",
      title: { en: "Food Street", ta: "உணவு தெரு" },
      text: { en: "Home kitchens and local vendors, from biryani to candy floss. Cashless UPI at every stall.",
              ta: "வீட்டு சமையல் முதல் உள்ளூர் விற்பனையாளர்கள் வரை, பிரியாணி முதல் கேண்டி ஃப்ளாஸ் வரை. ஒவ்வொரு கடையிலும் பணமில்லா UPI." } },
    { theme: "movies", icon: "movie",
      title: { en: "Movie Screenings", ta: "திரைப்பட காட்சிகள்" },
      text: { en: "Five films on the big screen in the AV room, from Zootopia 2 to Fall 2: Deadpoint. Show times coming soon.",
              ta: "AV அறையில் பெரிய திரையில் ஐந்து படங்கள், Zootopia 2 முதல் Fall 2: Deadpoint வரை. காட்சி நேரங்கள் விரைவில்." } }
  ],

  causes: [
    { icon: "cap",
      title: { en: "Education & Scholarships", ta: "கல்வி & உதவித்தொகை" },
      text: { en: "School fees, books and exam costs for students who’d otherwise drop out, including children from single-parent and hardworking families.",
              ta: "படிப்பை நிறுத்திவிடக்கூடிய மாணவர்களுக்கு பள்ளி கட்டணம், புத்தகங்கள் மற்றும் தேர்வுச் செலவுகள், தனிப் பெற்றோர் மற்றும் கடின உழைப்பாளர் குடும்பங்களின் குழந்தைகள் உட்பட." },
      stat: { en: "₹34,300 given last year", ta: "கடந்த ஆண்டு ₹34,300 வழங்கப்பட்டது" } },
    { icon: "heart",
      title: { en: "Medical Emergency Fund", ta: "மருத்துவ அவசர நிதி" },
      text: { en: "Fast, no-questions help when a family is hit with a sudden hospital bill.",
              ta: "திடீர் மருத்துவமனை கட்டணம் வரும்போது, கேள்விகள் இன்றி உடனடி உதவி." },
      stat: { en: "₹60,000 given last year", ta: "கடந்த ஆண்டு ₹60,000 வழங்கப்பட்டது" } },
    { icon: "hands",
      title: { en: "Hardship Support", ta: "கஷ்ட கால உதவி" },
      text: { en: "Rent, groceries and essentials for neighbours going through a hard stretch.",
              ta: "கடினமான காலகட்டத்தில் இருக்கும் அண்டை வீட்டாருக்கு வாடகை, மளிகை மற்றும் அத்தியாவசியப் பொருட்கள்." } }
  ],

  causeImpactTotal: "₹94,300",
  causeNote: { en: "That's ₹34,300 towards school and exam costs, and ₹60,000 towards medical emergencies, including a heart operation. No names, no fuss: just money that reached people who needed it, put to use last year.",
               ta: "அதாவது ₹34,300 பள்ளி மற்றும் தேர்வு செலவுகளுக்கும், ₹60,000 மருத்துவ அவசரநிலைகளுக்கும் (இதய அறுவை சிகிச்சை உட்பட). பெயர்கள் இல்லை, பகட்டு இல்லை: தேவைப்பட்டவர்களை சென்றடைந்த பணம், கடந்த ஆண்டு பயன்படுத்தப்பட்டது." },

  /* This is a standing yearly commitment, not a one-off — keep the
     wording in the present tense / "every year", not "last year". */
  causeActivitiesEyebrow: { en: "Every year, beyond the fundraiser", ta: "ஒவ்வொரு ஆண்டும், நிதி திரட்டலுக்கு அப்பால்" },
  causeActivities: { en: "Food donation drives, medical camps, and visits to local orphanages are run every year — not just funded by Vimusement, but organised by the same group, year after year.",
                      ta: "உணவு நன்கொடை முயற்சிகள், மருத்துவ முகாம்கள் மற்றும் உள்ளூர் அனாதை இல்ல வருகைகள் ஒவ்வொரு ஆண்டும் நடத்தப்படுகின்றன — வெறும் விமுஸ்மென்ட் மூலம் நிதியளிக்கப்படுவது மட்டுமல்ல, அதே குழுவால் ஆண்டுதோறும் ஏற்பாடு செய்யப்படுகிறது." },

  /* Home-page impact strip (the #why section). Numbers count up when
     scrolled into view. Set `text` instead of `n` for a non-numeric
     stat. `hide: true` skips one. `label` is bilingual; n/prefix/suffix
     stay plain (they're numerals, not language-specific). */
  impact: {
    stats: [
      { n: 94300, prefix: "₹", label: { en: "given to education and medical support last year", ta: "கடந்த ஆண்டு கல்வி மற்றும் மருத்துவ உதவிக்காக வழங்கப்பட்டது" } },
      { n: 100, suffix: "%", label: { en: "of what’s raised, after event costs, goes to the cause", ta: "நிகழ்வு செலவுகளுக்குப் பிறகு திரட்டப்பட்டதில், நோக்கத்திற்கு செல்கிறது" } },
      { n: 3, label: { en: "funds it feeds: scholarships, medical emergencies, hardship", ta: "இது ஆதரிக்கும் நிதிகள்: உதவித்தொகை, மருத்துவ அவசரநிலைகள், கஷ்ட உதவி" } },
      { text: "₹0", label: { en: "in payment fees. You pay the parish directly by UPI", ta: "கட்டண கட்டணங்களில். நீங்கள் UPI மூலம் நேரடியாக பங்குக்கு செலுத்துகிறீர்கள்" } }
    ]
  },

  involve: [
    { theme: "games",  icon: "hands",
      title: { en: "Volunteer", ta: "தன்னார்வலர்" },
      text: { en: "Give a few hours on the gates, the stalls, the food street or clean-up. Shifts as short as two hours. Message Austin on WhatsApp and we’ll find you a slot.",
              ta: "வாசல், கடைகள், உணவு தெரு அல்லது சுத்தம் செய்வதில் சில மணிநேரம் கொடுங்கள். இரண்டு மணிநேரம் முதலான ஷிப்ட்கள். WhatsApp-ல் ஆஸ்டினுக்கு செய்தி அனுப்புங்கள், உங்களுக்கு ஒரு நேரத்தை கண்டுபிடிப்போம்." },
      cta: { en: "Message Austin on WhatsApp", ta: "WhatsApp-ல் ஆஸ்டினுக்கு செய்தி அனுப்பவும்" }, form: "volunteer" },
    { theme: "movies", icon: "star",
      title: { en: "Sponsor", ta: "ஸ்பான்சர்" },
      text: { en: "Back the fair as a business or a family. Your name goes on the site and the screens, and a sponsorship is a donation to the same cause.",
              ta: "ஒரு வணிகமாகவோ அல்லது குடும்பமாகவோ திருவிழாவை ஆதரிக்கவும். உங்கள் பெயர் தளத்திலும் திரைகளிலும் இடம்பெறும், மேலும் ஸ்பான்சர்ஷிப் அதே நோக்கத்திற்கான நன்கொடை." },
      cta: { en: "Become a sponsor", ta: "ஸ்பான்சராக மாறுங்கள்" }, form: "sponsor" },
    { theme: "food",   icon: "stall",
      title: { en: "Run a Stall", ta: "கடை நடத்துங்கள்" },
      text: { en: "Food, games or crafts. Bring a stall and share the takings with the cause, then see what’s open and the table rates.",
              ta: "உணவு, விளையாட்டு அல்லது கைவினைப் பொருட்கள். ஒரு கடையை கொண்டு வந்து வருமானத்தை நோக்கத்துடன் பகிருங்கள், பின்னர் என்ன திறந்திருக்கிறது மற்றும் மேசை கட்டணங்களை பாருங்கள்." },
      cta: { en: "See stalls & rates", ta: "கடைகள் & கட்டணங்களை பார்க்கவும்" }, form: "stall" }
  ],

  /* ---------- STALLS  (the stalls.html page) ----------
     Rates are locked (2026 Stall Committee). `open[]` still empty — which
     specific stalls/categories are available hasn't been decided yet;
     fill it in once the category caps are set. Games are handled
     separately by Victorians (internal, not a vendor slot — see
     program.games below) and aren't priced here. `price` stays plain
     (₹ figures read the same in either language). */
  stalls: {
    intro: { en: "Bring a stall to Vimusement: food or a craft table. You keep it running on the night and share the takings with the cause.",
             ta: "விமுஸ்மென்ட்டிற்கு ஒரு கடையை கொண்டு வாருங்கள்: உணவு அல்லது கைவினைப் பொருட்கள் மேசை. இரவு முழுவதும் நீங்களே நடத்தி, வருமானத்தை நோக்கத்துடன் பகிரலாம்." },
    ratesNote: { en: "Prices include the stall rent and bench seating. Lights & electricity are included free with every stall.",
                 ta: "விலையில் கடை வாடகை மற்றும் இருக்கை பெஞ்ச் ஆகியவை அடங்கும். விளக்குகள் & மின்சாரம் ஒவ்வொரு கடையிலும் இலவசமாக சேர்க்கப்பட்டுள்ளது." },
    /* Two tiers by category (locked, per the 2026 Stall Committee's
       working notes) — Promotional stalls fall under the Craft/mid-tier
       rate, not a separate price. */
    rates: [
      { name: { en: "Food & Beverages — full stall", ta: "உணவு & பானங்கள் — முழு கடை" }, price: "₹7,000", icon: "food" },
      { name: { en: "Food & Beverages — half stall", ta: "உணவு & பானங்கள் — அரை கடை" }, price: "₹4,000", icon: "food" },
      { name: { en: "Craft, mid-tier & promotional — full stall", ta: "கைவினை, நடுத்தர & விளம்பர — முழு கடை" }, price: "₹6,000", icon: "stall" },
      { name: { en: "Craft, mid-tier & promotional — half stall", ta: "கைவினை, நடுத்தர & விளம்பர — அரை கடை" }, price: "₹3,500", icon: "stall" }
    ],
    open: [
      // "Snack stall", "Craft table"
    ],
    /* inspiration for people who want to run a stall but don't know
       what to set up yet — grouped by the two real pricing tiers
       above so the suggestion always maps to a real rate. Purely
       illustrative; edit freely as ideas come in from the committee. */
    ideas: {
      food: [
        { en: "Chaat corner — pani puri, bhel, sundal", ta: "சாட் கார்னர் — பானி பூரி, பேல், சுண்டல்" },
        { en: "Filter coffee & masala chai", ta: "ஃபில்டர் காபி & மசாலா தேநீர்" },
        { en: "Ice cream, slush or cold drinks", ta: "ஐஸ்கிரீம், ஸ்லஷ் அல்லது குளிர்பானங்கள்" },
        { en: "Home-style biryani or fried rice", ta: "வீட்டு பிரியாணி அல்லது ஃபிரைடு ரைஸ்" },
        { en: "Bakes, cupcakes & desserts", ta: "பேக்குகள், கப்கேக்குகள் & இனிப்புகள்" },
        { en: "Momos or other street snacks", ta: "மோமோஸ் அல்லது தெரு தின்பண்டங்கள்" }
      ],
      craft: [
        { en: "Handmade jewellery or accessories", ta: "கைவினைப் பொருட்கள் அல்லது அணிகலன்கள்" },
        { en: "Henna & face painting", ta: "மருதாணி & முக ஓவியம்" },
        { en: "Photography prints or portraits", ta: "புகைப்பட பிரிண்ட்கள் அல்லது உருவப்படங்கள்" },
        { en: "Upcycled home décor", ta: "மறுசுழற்சி வீட்டு அலங்காரப் பொருட்கள்" },
        { en: "Tarot or fortune-telling corner", ta: "டாரோ அல்லது ஜோதிட மூலை" },
        { en: "A local business or youth-group promo table", ta: "உள்ளூர் வணிகம் அல்லது இளையோர் குழு விளம்பர மேசை" }
      ]
    },
    // Stall enquiries go to Janet, the 2026 Stall Committee Head (not Austin — that's the general volunteer contact above).
    contactWhatsApp: "https://wa.me/917550217454?text=Hi%20Janet%2C%20I%27d%20like%20to%20run%20a%20stall%20at%20Vimusement%202026.",
    contactInstagram: "https://ig.me/m/victorians.youth"
  },

  /* ---------- SPONSORSHIP  (the sponsors.html page) ----------
     Contact reuses forms.sponsor above (Fredrica, Victorians Youth
     Joint Secretary) rather than duplicating the number here.
     Amounts are a starting point, not locked — edit freely as the
     committee sets real figures. Product/Prize partners give goods
     or vouchers instead of a cash amount, so `amount` is text there. */
  /* ---------- SPONSORS DECK  (the green spark, top-right of every page) ----------
     Hover/tap the spark → this year's sponsor logos fan out; hover/tap a
     logo → their visiting card. Order here = order in the deck.
       name – alt text / screen readers (shown on screen only while there is no card yet)
       logo – square-ish PNG with a transparent background (assets/img/2026/sponsors/)
       card – visiting card / promo: an image or a short .mp4. A transparent PNG/WebP
              (light text, no background) looks best — it sits on dark frosted
              glass. "" shows a "coming soon" card.
       url  – optional; clicking the logo (or the card) opens it in a new tab.
              On touch: first tap shows the card, second tap opens the site.
     An empty list hides the spark entirely. */
  sponsors: [
    { name: "Dr. M.A. Mejalla MDS, Dental Surgeon", logo: "assets/img/2026/sponsors/sponsor-01.png", card: "assets/img/2026/sponsors/sponsor-01-card-dark.webp", url: "https://www.drmdentistry.com/" }
  ],

  sponsorship: {
    intro: { en: "Back Vimusement as a business or a family — a contribution, products, or prizes all help, and every tier gets your name in front of the crowd.",
             ta: "ஒரு வணிகமாகவோ அல்லது குடும்பமாகவோ விமுஸ்மென்ட்டை ஆதரிக்கவும் — ஒரு பங்களிப்பு, பொருட்கள், அல்லது பரிசுகள் அனைத்தும் உதவும், ஒவ்வொரு நிலையும் கூட்டத்தின் முன் உங்கள் பெயரைக் கொண்டு வரும்." },
    tiers: [
      { key: "community", amount: { en: "Flexible", ta: "நெகிழ்வானது" },
        name: { en: "Community Partner", ta: "சமூக பங்குதாரர்" },
        benefits: { en: "Logo on event banners, a mention in our social media posts, and a shout-out on stage — let's talk about what works for you.",
                    ta: "நிகழ்வு பதாகைகளில் லோகோ, எங்கள் சமூக ஊடக இடுகைகளில் ஒரு குறிப்பு, மேலும் மேடையில் ஒரு குறிப்பு — உங்களுக்கு ஏற்றதைப் பற்றி பேசலாம்." } },
      { key: "product", amount: { en: "Products / vouchers", ta: "பொருட்கள் / வவுச்சர்கள்" },
        name: { en: "Product Partner", ta: "பொருள் பங்குதாரர்" },
        benefits: { en: "Give what you make or sell — food, drinks, goods — and we promote your brand in return.",
                    ta: "நீங்கள் தயாரிப்பது அல்லது விற்பதை கொடுங்கள் — உணவு, பானங்கள், பொருட்கள் — நாங்கள் பதிலுக்கு உங்கள் பிராண்டை விளம்பரப்படுத்துவோம்." } },
      { key: "prize",   amount: { en: "Gifts / vouchers", ta: "பரிசுகள் / வவுச்சர்கள்" },
        name: { en: "Prize Partner", ta: "பரிசு பங்குதாரர்" },
        benefits: { en: "Sponsor a game prize — your brand gets named the moment it's won.",
                    ta: "ஒரு விளையாட்டு பரிசை நிதியளியுங்கள் — அது வெல்லப்படும் தருணத்தில் உங்கள் பிராண்டு பெயரிடப்படும்." } }
    ],
    why: [
      { icon: "hands", title: { en: "A local, built-in crowd", ta: "உள்ளூர், உள்ளடங்கிய கூட்டம்" },
        text: { en: "Families and young people from right around Aminjikkarai, all in one place for a day.",
                ta: "அமின்ஜிக்கரை சுற்றியுள்ள குடும்பங்களும் இளைஞர்களும், ஒரு நாளில் ஒரே இடத்தில்." } },
      { icon: "star", title: { en: "Real, visible branding", ta: "உண்மையான, தெரியும் பிராண்டிங்" },
        text: { en: "Posters, banners, stage announcements and screens on the day — not just a logo in fine print.",
                ta: "நாளின் போது சுவரொட்டிகள், பதாகைகள், மேடை அறிவிப்புகள் மற்றும் திரைகள் — வெறும் சிறிய எழுத்தில் ஒரு லோகோ மட்டுமல்ல." } },
      { icon: "heart", title: { en: "It's a donation too", ta: "இது ஒரு நன்கொடையும் கூட" },
        text: { en: "Every rupee (or product) goes toward the same scholarships, medical fund and hardship support Vimusement runs on.",
                ta: "ஒவ்வொரு ரூபாயும் (அல்லது பொருளும்) விமுஸ்மென்ட் நடத்தும் அதே உதவித்தொகை, மருத்துவ நிதி மற்றும் கஷ்ட உதவிக்கு செல்கிறது." } }
    ]
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
      { upTo: 350,       text: { en: "a week of groceries for a family having a hard month", ta: "கடினமான மாதத்தை கடக்கும் ஒரு குடும்பத்திற்கு ஒரு வார மளிகைப் பொருட்கள்" } },
      { upTo: 800,       text: { en: "exam fees and a set of textbooks for one student", ta: "ஒரு மாணவருக்கு தேர்வு கட்டணம் மற்றும் ஒரு தொகுப்பு பாடப்புத்தகங்கள்" } },
      { upTo: 1800,      text: { en: "a term of school fees for a child who might have dropped out", ta: "படிப்பை நிறுத்தியிருக்கக்கூடிய ஒரு குழந்தைக்கு ஒரு டேர்ம் பள்ளி கட்டணம்" } },
      { upTo: 6000,      text: { en: "a real dent in a hospital bill a family can't meet alone", ta: "ஒரு குடும்பத்தால் தனியாக சமாளிக்க முடியாத மருத்துவமனை கட்டணத்தில் உண்மையான உதவி" } },
      { upTo: Infinity,  text: { en: "a full term of support for a student, or an emergency met the same day", ta: "ஒரு மாணவருக்கு முழு டேர்ம் ஆதரவு, அல்லது அன்றே சந்திக்கப்பட்ட ஒரு அவசரநிலை" } }
    ],
    wallByDefault: true,     // pre-tick "show my name on the wall"
    confirmWithinText: { en: "usually within a day", ta: "பொதுவாக ஒரு நாளுக்குள்" },
    showTotal: false,        // show the running total raised (aggregate, not per-person)
    goal: 0,                 // ₹ target for the thermometer (0 = hide the bar)
    scrollerHint: { en: "Amounts are never shown. Every gift counts the same.", ta: "தொகைகள் ஒருபோதும் காட்டப்படாது. ஒவ்வொரு நன்கொடையும் சமமாக கணக்கிடப்படுகிறது." }
  },

  /* ---------- LUCKY DRAW  (draw.html) ----------
     2026 runs OFFLINE: paper tickets sold at a counter in Ascension
     Church, every day until the fair; drawn live on stage on the day.
     draw.html is a showcase — the prizes + where to buy — with no online
     purchase. `enabled` is the ONLINE side (UPI sales, the staff-desk
     ticket tab, the Apps Script draw* actions): keep it false while
     tickets are paper-only. */
  luckyDraw: {
    enabled: false,          // online sales — off; the page still shows
    price: 50,               // ₹ per ticket, as sold at the counter
    maxOnline: 25,
    confirmWithinText: { en: "usually within a day", ta: "பொதுவாக ஒரு நாளுக்குள்" },

    /* Almost confirmed (Sep 2026). All branded.
       icon  — the drawing on the page: sofa · airfryer · mixer · cooker · gift
       worth — ₹ value, shown on the card; the page adds them up for the total
       sub   — optional one-liner under the name
       First entry is the grand prize. */
    branded: true,           // shows the "Branded" badge on every prize
    prizes: [
      { place: { en: "1st prize", ta: "1வது பரிசு" }, name: { en: "Sofa", ta: "சோஃபா" }, icon: "sofa", worth: 12000,
        sub: { en: "Three-seater", ta: "மூன்று இருக்கை" } },
      { place: { en: "2nd prize", ta: "2வது பரிசு" }, name: { en: "Air fryer", ta: "ஏர் ஃப்ரையர்" }, icon: "airfryer", worth: 7000 },
      { place: { en: "3rd prize", ta: "3வது பரிசு" }, name: { en: "Mixer", ta: "மிக்ஸி" }, icon: "mixer", worth: 5000 },
      { place: { en: "4th prize", ta: "4வது பரிசு" }, name: { en: "Cooker", ta: "குக்கர்" }, icon: "cooker", worth: 4000 }
    ],
    /* Who gave the four branded prizes above — credited on every prize
       card, in a strip under the prizes heading, and in a thank-you card.
       logo: drop the file in assets/img/2026/sponsors/ and put the path here
       ("" shows a gold monogram of the initials). url: optional website. */
    prizeSponsor: {
      name: "George Enterprises",
      logo: "",
      url: ""
    },

    /* Special surprise prizes — deliberately NOT named on the site; they're
       revealed on the night. Change `count` to add or remove mystery cards. */
    surprises: { count: 2 },

    /* More gifts are planned on top of the list above (number not fixed
       yet). true shows a "Plus more gifts to be won" strip; set a number,
       e.g. moreGifts: 10, once it's known and the strip says so. */
    moreGifts: true,

    prizesNote: { en: "Prizes are almost final. Any small change will be announced here before the draw.",
                  ta: "பரிசுகள் கிட்டத்தட்ட இறுதியானவை. ஏதேனும் சிறு மாற்றம் இருந்தால் குலுக்கலுக்கு முன் இங்கே அறிவிக்கப்படும்." },

    /* where the paper tickets are sold */
    counter: {
      where: { en: "Ticket counter, Ascension Church", ta: "சீட்டு கவுண்டர், அசென்ஷன் தேவாலயம்" },
      when:  { en: "Open every day until the fair", ta: "விழா வரை ஒவ்வொரு நாளும் திறந்திருக்கும்" }
    },
    drawWhen: { en: "Sunday 25 October, 7:30pm · live on stage after evening mass",
                ta: "ஞாயிறு அக்டோபர் 25, இரவு 7:30 · மாலை திருப்பலிக்குப் பிறகு மேடையில் நேரடியாக" },

    blurb: { en: "Pick up a ticket at the counter in Ascension Church, any day before the fair. Every ticket is a gift to the cause, and a shot at more prizes than ever, including two surprises.",
             ta: "விழாவுக்கு முன் எந்த நாளிலும் அசென்ஷன் தேவாலயத்தில் உள்ள கவுண்டரில் சீட்டு வாங்குங்கள். ஒவ்வொரு சீட்டும் நோக்கத்திற்கான ஒரு பரிசு, மேலும் இதுவரை இல்லாத அளவு பரிசுகளை வெல்லும் வாய்ப்பு, இரண்டு ஆச்சரியங்கள் உட்பட." }
  },

  /* ---------- PROGRAM  (screenings + games, by venue) ----------
     `venue` must match a venueMap.zones[].venue string below — these
     stay PLAIN strings (matching keys, not display text; see the note
     at the top of this file). Give a screening a `title` and `time`
     and it shows in the line-up; leave them blank and the page just
     shows the count per room until the committee locks the line-up.
     ~9 screenings across the two rooms. */
  program: {
    /* The shape of the day. Shown as a ribbon on the Programme page, with a
       live "you are here" marker during the fair itself. Times are "HH:MM"
       (24h, local). Adjust once the running order is set. */
    timeline: [
      { at: "07:30", label: { en: "Doors open", ta: "வாயில் திறப்பு" }, icon: "gate",
        note: { en: "Breakfast, food stalls, games and craft tables", ta: "காலை உணவு, உணவு கடைகள், விளையாட்டுகள் மற்றும் கைவினை மேசைகள்" } },
      { at: "10:00", label: { en: "Screenings begin", ta: "திரையிடல் தொடங்குகிறது" }, icon: "movie",
        note: { en: "In the AV room, running through the day", ta: "AV அறையில், நாள் முழுவதும் நடைபெறும்" } },
      { at: "18:00", label: { en: "Evening mass", ta: "மாலை திருப்பலி" }, icon: "bell",
        note: { en: "In the church", ta: "தேவாலயத்தில்" } },
      { at: "19:30", label: { en: "Lucky draw", ta: "லக்கி டிரா" }, icon: "star",
        note: { en: "Drawn live on stage, right after mass", ta: "திருப்பலிக்குப் பிறகு மேடையில் நேரடியாக" } },
      { at: "21:00", label: { en: "Screenings close", ta: "திரையிடல் நிறைவு" }, icon: "moon",
        note: { en: "The last films wrap up", ta: "கடைசி படங்கள் முடிவடைகின்றன" } }
    ],
    screeningsNote: { en: "The planned line-up: five films, all in the AV room. Show times are announced closer to the date.",
                       ta: "திட்டமிடப்பட்ட பட்டியல்: ஐந்து படங்கள், அனைத்தும் AV அறையில். காட்சி நேரங்கள் தேதிக்கு நெருக்கமாக அறிவிக்கப்படும்." },
    /* The 2026 line-up — PLANNED (Sep 2026), timings not confirmed.
       Every film is in the AV Room this year. `time` is "HH:MM" (24h);
       "" = not announced yet. `venue` must match a venueMap zone ("" shows
       "Room TBA"). Titles stay plain strings (film names aren't translated). */
    screenings: [
      { title: "Brand New Day",     time: "", venue: "AV Room", rating: "" },
      { title: "Obsession",         time: "", venue: "AV Room", rating: "" },
      { title: "Sheep Detectives",  time: "", venue: "AV Room", rating: "" },
      { title: "Fall 2: Deadpoint", time: "", venue: "AV Room", rating: "" },
      { title: "Zootopia 2",        time: "", venue: "AV Room", rating: "" }
    ],
    games: [
      { name: { en: "Housie / Tambola", ta: "ஹவுசி / தம்போலா" },     venue: "Center of Attraction" },
      { name: { en: "Carrom challenge", ta: "கேரம் சவால்" },          venue: "Center of Attraction" },
      { name: { en: "Ring toss", ta: "ரிங் டாஸ்" },                   venue: "Center of Attraction" },
      { name: { en: "Hoopla", ta: "ஹூப்லா" },                        venue: "Center of Attraction" },
      { name: { en: "Dart the balloon", ta: "பலூன் டார்ட்" },         venue: "Center of Attraction" },
      { name: { en: "Lucky dip", ta: "லக்கி டிப்" },                  venue: "Center of Attraction" },
      { name: { en: "Bottle knock-down", ta: "பாட்டில் நாக்-டவுன்" }, venue: "Center of Attraction" },
      { name: { en: "Guess the jar", ta: "ஜாடியை யூகிக்கவும்" },      venue: "Center of Attraction" }
    ]
  },

  /* ---------- VENUE MAP  (the grounds plan on the Programme page) ----------
     The plan is drawn in modules/venuemap.js, traced from the committee's
     layout sketch: 27 numbered stalls (1–27, sequential) around the
     Center of Attraction, the church block up top, the AV Room beside
     stalls 17–20, Food Counter, Entry at the foot.

     zones[]  — the named (non-stall) areas. `id` must match a data-zone in
                the SVG; `venue` is matched against program[].venue above —
                stays a plain string (matching key), only `label`/`blurb`
                are bilingual display text.
     stalls   — fill a number in as it's assigned, e.g.
                  "12": { for: "Home bakes & preserves", by: "St. Anne's Guild" }
                anything not listed shows "Not assigned yet". */
  venueMap: {
    planImage: "",
    caption: { en: "Tap a spot on the plan to see what’s there. Stalls are still being assigned.",
               ta: "என்ன இருக்கிறது என்பதைக் காண திட்டத்தில் ஒரு இடத்தை தட்டவும். கடைகள் இன்னும் ஒதுக்கப்பட்டு வருகின்றன." },
    zones: [
      { id: "entry",    label: { en: "Entry", ta: "நுழைவு" }, venue: "Gate",
        blurb: { en: "Come in here.", ta: "இங்கே வாருங்கள்." } },
      { id: "center",   label: { en: "Center of Attraction", ta: "முக்கிய கவர்ச்சி மையம்" }, venue: "Center of Attraction",
        blurb: { en: "The main stage and the open games area. Live through the day, and the lucky draw is called here after mass.",
                 ta: "முக்கிய மேடை மற்றும் திறந்த விளையாட்டு பகுதி. நாள் முழுவதும் நேரடி நிகழ்ச்சிகள், திருப்பலிக்குப் பிறகு இங்கே லக்கி டிரா அழைக்கப்படும்." } },
      { id: "food",     label: { en: "Food Counter", ta: "உணவு கவுண்டர்" }, venue: "Food Street",
        blurb: { en: "Breakfast from 7:30, then snacks and meals all day. Cashless UPI.",
                 ta: "7:30 முதல் காலை உணவு, பின்னர் நாள் முழுவதும் சிற்றுண்டி மற்றும் உணவுகள். பணமில்லா UPI." } },
      { id: "basement", label: { en: "Basement", ta: "பேஸ்மென்ட்" }, venue: "Basement",
        blurb: { en: "No screenings down here this year. Every film is in the AV room, above stalls 17–20.",
                 ta: "இந்த ஆண்டு இங்கே திரையிடல் இல்லை. எல்லா படங்களும் கடைகள் 17–20க்கு மேலுள்ள AV அறையில்." } },
      { id: "av",       label: { en: "AV Room", ta: "AV அறை" }, venue: "AV Room",
        blurb: { en: "Every screening is here, on the third floor above stalls 17–20. Follow the signs.",
                 ta: "எல்லா திரையிடல்களும் இங்கே, கடைகள் 17–20க்கு மேல் மூன்றாவது மாடியில். அடையாளங்களை பின்பற்றவும்." } },
      { id: "church",   label: { en: "Church", ta: "தேவாலயம்" }, venue: "Church",
        blurb: { en: "Evening mass at 6. Open through the day for a quiet moment.",
                 ta: "மாலை 6 மணிக்கு திருப்பலி. அமைதியான தருணத்திற்கு நாள் முழுவதும் திறந்திருக்கும்." } },
      { id: "chapel",   label: { en: "Chapel", ta: "தேவாலய அறை" }, venue: "Chapel",
        blurb: { en: "A quiet side chapel, open all day.", ta: "ஒரு அமைதியான பக்க தேவாலய அறை, நாள் முழுவதும் திறந்திருக்கும்." } },
      { id: "tickets",  label: { en: "Gifts & tokens", ta: "பரிசுகள் & டோக்கன்கள்" }, venue: "Gifts",
        blurb: { en: "Event tees and the Victorians Youth table. Game tokens are handed out here too.",
                 ta: "நிகழ்வு டீ-சட்டைகள் மற்றும் விக்டோரியன்ஸ் யூத் மேசை. விளையாட்டு டோக்கன்களும் இங்கே கொடுக்கப்படும்." } }
    ],
    stalls: {
      // "1": { for: "", by: "" },
    }
  }
};
