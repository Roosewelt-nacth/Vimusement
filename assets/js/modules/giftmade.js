/* ============================================================
   MODULE — giftmade  (donate.html)
   "Your gift, made real": beside the amount picker, a small drawing
   of what that amount does (a bag of groceries, textbooks, a school
   bag, a hospital bill met, a full term) swaps in as the amount
   changes, with the amount's own 40 · 30 · 30 split underneath.
   Reads the page's own amount + funds line (donate.js), so it never
   changes how paying works.
   ============================================================ */
Vim.register("giftmade", function (ctx) {
  var fundsEl = ctx.$("[data-donate-funds]"), out = ctx.$("[data-donate-amount]");
  var tiers = ((ctx.year.donation || {}).funds || []).slice().sort(function (a, b) { return (a.upTo || 0) - (b.upTo || 0); });
  var pledge = (ctx.year.causes || []).filter(function (c) { return c.share != null; });
  if (!fundsEl || !out || !tiers.length) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function inr(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

  // one drawing per tier, in the same order as donation.funds (smallest first)
  var ART = [
    // a bag of groceries
    '<path d="M18 26 H46 L43 56 H21 Z"/><path d="M25 26 V21 a7 7 0 0 1 14 0 V26"/><path class="gm-fill" d="M27 26 C24 17 30 12 32 10 C33 15 31 21 30 26"/><path class="gm-fill" d="M35 26 C36 19 41 16 44 16 C43 21 40 24 37 26"/>',
    // a stack of textbooks
    '<rect x="14" y="44" width="36" height="9" rx="2"/><rect x="18" y="35" width="32" height="9" rx="2"/><rect class="gm-fill" x="12" y="26" width="34" height="9" rx="2"/><path d="M20 44 V53 M24 35 V44 M18 26 V35"/>',
    // a school bag
    '<rect x="17" y="18" width="30" height="38" rx="9"/><path d="M26 18 V14 a6 6 0 0 1 12 0 V18"/><rect class="gm-fill" x="22" y="36" width="20" height="13" rx="3"/><path d="M22 41 H42"/>',
    // a hospital bill met: a heart with a pulse
    '<path d="M32 54 C14 42 12 30 18 24 C23 19 29 21 32 26 C35 21 41 19 46 24 C52 30 50 42 32 54 Z"/><path class="gm-line" d="M14 38 H24 L27 32 L31 44 L35 34 L37 38 H50"/>',
    // a full term: a graduation cap
    '<path class="gm-fill" d="M32 16 L56 27 L32 38 L8 27 Z"/><path d="M18 32 V43 C24 49 40 49 46 43 V32"/><path d="M52 29 V42"/><circle cx="52" cy="44" r="2"/>'
  ];
  var card = document.createElement("div");
  card.className = "giftmade";
  card.innerHTML = '<div class="giftmade__art" aria-hidden="true" data-gm-art></div><div class="giftmade__body"><div class="giftmade__split" aria-hidden="true" data-gm-split></div></div>';
  fundsEl.parentNode.insertBefore(card, fundsEl);
  ctx.$(".giftmade__body", card).insertBefore(fundsEl, ctx.$("[data-gm-split]", card));   // the "what it does" line sits beside its drawing
  var artEl = ctx.$("[data-gm-art]", card), splitEl = ctx.$("[data-gm-split]", card), cur = -1;

  function tierOf(a) { for (var i = 0; i < tiers.length; i++) if (a <= (tiers[i].upTo || Infinity)) return i; return tiers.length - 1; }
  function update() {
    var a = Number((out.textContent || "").replace(/[^\d]/g, "")) || 0;
    card.classList.toggle("is-empty", !(a > 0));
    if (!(a > 0)) return;
    splitEl.innerHTML = pledge.map(function (f) {
      return '<span style="--fund:' + esc(f.color) + '"><b>' + inr(a * f.share / 100) + '</b>' + esc(ctx.L(f.short || f.title)) + '</span>';
    }).join("");
    var t = Math.min(ART.length - 1, tierOf(a));
    if (t === cur) return;
    var old = artEl.querySelector("svg");
    if (old && !ctx.reducedMotion) { old.classList.add("is-out"); setTimeout(function () { old.remove(); }, 380); } else if (old) old.remove();
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 64 64"); s.innerHTML = ART[t];
    if (!ctx.reducedMotion) s.classList.add("is-in");
    artEl.appendChild(s); cur = t;
  }
  new MutationObserver(update).observe(out, { childList: true, characterData: true, subtree: true });
  update();
});
