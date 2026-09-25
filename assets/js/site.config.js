/* ============================================================
   SITE CONFIG — things that DON'T change year to year.
   Year-specific content lives in /years/<year>.config.js
   ============================================================ */
window.VIM_SITE = {
  name: "Vimusement",
  shortName: "Vimusement",
  tagline: { en: "An annual parish fundraiser. Games and films for a day; scholarships, care and dignity all year.",
             ta: "ஆண்டு தோறும் நடைபெறும் பங்கு நிதி திரட்டு நிகழ்வு. ஒரு நாள் விளையாட்டுகளும் திரைப்படங்களும்; ஆண்டு முழுவதும் கல்வி உதவி, பராமரிப்பு மற்றும் மரியாதை." },

  /* The whole site's navigation — one page per purpose. `label` is
     bilingual {en, ta}, resolved via ctx.L() wherever it's rendered.
     `icon` keys are defined in assets/js/modules/chrome.js.
     `cta: true` renders as the highlighted Donate pill on the right.
     `primary: true` keeps that link directly on the dock, at every
     screen size. Anything without it never sits on the bar at all —
     it only ever lives in the dock's "More" dropdown instead. */
  pages: [
    // dock:false — the Vimusement mark at the start of the bar already goes home, so
    // Home isn't repeated on the dock; it still appears in the footer's page list.
    { label: { en: "Home", ta: "முகப்பு" },              file: "index.html",     icon: "home",   primary: true, dock: false },
    { label: { en: "Programme", ta: "நிகழ்ச்சி நிரல்" },   file: "programme.html", icon: "screen", primary: true },
    { label: { en: "The Cause", ta: "நோக்கம்" },          file: "cause.html",     icon: "heart",  primary: true },
    { label: { en: "Movies", ta: "திரைப்படங்கள்" },         file: "movies.html",    icon: "film",   primary: true },
    { label: { en: "Lucky Draw", ta: "லக்கி டிரா" },       file: "draw.html",      icon: "ticket", primary: true },
    { label: { en: "Gallery", ta: "புகைப்படங்கள்" },       file: "gallery.html",   icon: "photos" },
    { label: { en: "Get Involved", ta: "பங்கேற்க" },       file: "involve.html",   icon: "people" },
    { label: { en: "Sponsorship", ta: "ஸ்பான்சர்ஷிப்" },   file: "sponsors.html",  icon: "star" },
    { label: { en: "Find My Donation", ta: "எனது நன்கொடை" }, file: "tickets.html", icon: "search" },
    // { label: { en: "Developers", ta: "டெவலப்பர்கள்" }, file: "developers.html", icon: "code" },   // hidden for now — page still exists, just not linked
    { label: { en: "Donate", ta: "நன்கொடை" },             file: "donate.html",    icon: "gift", cta: true }
  ],

  /* The organising group. Save two files under assets/img/shared/ :
       victorians.svg        — the logo as-is (black), for light backgrounds
       victorians-light.svg  — a white/cream version, for dark backgrounds
     (PNG with transparency is fine too — just match the file names.)
     `name` stays untranslated (proper noun/brand); `tagline` is bilingual. */
  org: {
    name: "Victorians Youth",
    tagline: { en: "An initiative of Victorians Youth", ta: "விக்டோரியன்ஸ் யூத் இன் ஒரு முயற்சி" },
    url: "https://www.instagram.com/victorians.youth/",
    logo: "assets/img/shared/victorians-mark.png",         // the V mark, black — light backgrounds
    logoLight: "assets/img/shared/victorians-mark-light.png", // the V mark, cream — dark backgrounds
    logoFull: "assets/img/shared/victorians.png"            // full lockup with the wordmark
  },

  /* Optional — leave "" to hide.
     instagram: full profile URL, e.g. "https://instagram.com/yourparish" —
     used for the gallery's "Follow on Instagram" link and the footer. */
  social: {
    instagram: "https://www.instagram.com/victorians.youth/",
    facebook: "",
    whatsappChannel: ""
  },

  footerNote: { en: "An annual fundraiser by the parish community.",
                ta: "பங்கு சமூகத்தால் நடத்தப்படும் ஆண்டு நிதி திரட்டு நிகழ்வு." }
};
