/* ============================================================
   SITE CONFIG — things that DON'T change year to year.
   Year-specific content lives in /years/<year>.config.js
   ============================================================ */
window.VIM_SITE = {
  name: "Vimusement",
  shortName: "Vimusement",
  tagline: "An annual parish fundraiser — games and films tonight; scholarships, care and dignity all year.",

  /* The whole site's navigation — one page per purpose.
     `icon` keys are defined in assets/js/modules/chrome.js.
     `cta: true` renders as the highlighted Donate pill on the right. */
  pages: [
    { label: "Home",         file: "index.html",     icon: "home" },
    { label: "Programme",     file: "programme.html", icon: "screen" },
    { label: "The Cause",     file: "cause.html",     icon: "heart" },
    { label: "Lucky Draw",    file: "draw.html",      icon: "ticket" },
    { label: "Gallery",       file: "gallery.html",   icon: "photos" },
    { label: "Get Involved",  file: "involve.html",   icon: "people" },
    { label: "Donate",        file: "donate.html",    icon: "gift", cta: true }
  ],

  /* The organising group. Save two files under assets/img/shared/ :
       victorians.svg        — the logo as-is (black), for light backgrounds
       victorians-light.svg  — a white/cream version, for dark backgrounds
     (PNG with transparency is fine too — just match the file names.) */
  org: {
    name: "Victorians Youth",
    tagline: "An initiative of Victorians Youth",
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

  footerNote: "An annual fundraiser by the parish community."
};
