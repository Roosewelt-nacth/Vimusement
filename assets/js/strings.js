/* ============================================================
   VIMUSEMENT — UI string dictionary (English / Tamil)
   -----------------------------------------------------------
   Two kinds of keys live here:
     - static-HTML text swapped in by modules/i18n.js via [data-i18n]
     - hardcoded JS strings modules read via ctx.t("key")
     - backend error CODES (namespace "err.") the frontend maps to
       a message via ctx.t("err." + res.error) — see apps-script/Code.gs

   Content that comes from years/2026.config.js (causes, schedule,
   prizes, venue blurbs…) is translated IN that file instead, as
   {en:"..", ta:".."} pairs resolved by ctx.L() — not duplicated here.

   Tamil text drafted for review — check with a fluent reader before
   the event, especially anything money/payment-related.
   ============================================================ */
window.VIM_STRINGS = {
  en: {
    "lang.toggle.en": "Language: English. Tap for தமிழ்.",
    "lang.toggle.ta": "மொழி: தமிழ். Tap for English.",

    "nav.more": "More pages",
    "footer.pages": "Pages",
    "footer.reachUs": "Reach us",
    "footer.blurb": "An annual fundraiser by the parish community. One night of games and films, turned into scholarships, care and dignity all year.",
    "footer.instagram": "Instagram · @victorians.youth",
    "footer.staffLine": "For volunteers ·",
    "footer.staffDesk": "Staff desk",
    "footer.liveDraw": "Live draw screen",
    "footer.orgFallback": "An initiative of {org}",
    "hero.orgLockup": "An initiative of",

    "card.learnMore": "Learn more",
    "stalls.ratesTbc": "Table rates to be confirmed",
    "stalls.openTbc": "The list of open stalls is being drawn up. Message us to reserve one now."
  },
  ta: {
    "lang.toggle.en": "மொழி: ஆங்கிலம். தமிழுக்கு தட்டவும்.",
    "lang.toggle.ta": "Language: Tamil. Tap for English.",

    "nav.more": "மேலும் பக்கங்கள்",
    "footer.pages": "பக்கங்கள்",
    "footer.reachUs": "எங்களை தொடர்பு கொள்ள",
    "footer.blurb": "பங்கு சமூகத்தால் நடத்தப்படும் ஆண்டு நிதி திரட்டு நிகழ்வு. விளையாட்டுகளும் திரைப்படங்களும் நிறைந்த ஒரு இரவு, ஆண்டு முழுவதும் கல்வி உதவி, பராமரிப்பு மற்றும் மரியாதைக்குரிய வாழ்வாக மாறுகிறது.",
    "footer.instagram": "Instagram · @victorians.youth",
    "footer.staffLine": "தன்னார்வலர்களுக்கு ·",
    "footer.staffDesk": "பணியாளர் மேசை",
    "footer.liveDraw": "நேரடி சீட்டு எடுப்பு திரை",
    "footer.orgFallback": "{org} இன் ஒரு முயற்சி",
    "hero.orgLockup": "ஒரு முயற்சி",

    "card.learnMore": "மேலும் அறிய",
    "stalls.ratesTbc": "கடை கட்டணங்கள் விரைவில் அறிவிக்கப்படும்",
    "stalls.openTbc": "திறந்திருக்கும் கடைகளின் பட்டியல் தயாராகி வருகிறது. இப்போதே ஒன்றை பதிவு செய்ய எங்களுக்கு செய்தி அனுப்பவும்."
  }
};
