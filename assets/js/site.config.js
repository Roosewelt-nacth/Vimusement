/* ============================================================
   SITE CONFIG — things that DON'T change year to year.
   Year-specific content lives in /years/<year>.config.js
   ============================================================ */
window.VIM_SITE = {
  name: "Vimusement",
  shortName: "Vimusement",
  tagline: "An annual parish fundraiser — games and films tonight; scholarships, care and dignity all year.",

  nav: [
    { label: "What’s On",     href: "#whats-on" },
    { label: "The Cause",     href: "#cause" },
    { label: "Banner Reveal", href: "#reveal" },
    { label: "Get Involved",  href: "#involve" }
  ],

  /* Optional — leave "" to hide.
     instagram: full profile URL, e.g. "https://instagram.com/yourparish" —
     used for the gallery's "Follow on Instagram" link and the footer. */
  social: {
    instagram: "https://www.instagram.com/victorians.youth/",
    facebook: "",
    whatsappChannel: ""
  },

  footerNote: "Built to be reused every year. Placeholder content — event date, venue, artwork and figures to be confirmed."
};
