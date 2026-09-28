/* ============================================================
   MODULE — receiptprint  (tickets.html)
   When a donation is found, it doesn't just appear: it feeds out of
   a slim printer slot, a line at a time, like a counter receipt.
   Watches the lookup results that tickets.js fills in.
   ============================================================ */
Vim.register("receiptprint", function (ctx) {
  var results = ctx.$("[data-lookup-results]");
  if (!results || ctx.reducedMotion) return;
  var slot = document.createElement("div"); slot.className = "rp-slot"; slot.setAttribute("aria-hidden", "true");
  results.parentNode.insertBefore(slot, results);
  new MutationObserver(function () {
    var cards = ctx.$$(".lookup-ticket", results).filter(function (c) { return !c.classList.contains("rp"); });
    if (!cards.length) return;
    slot.classList.add("is-on");
    cards.forEach(function (c, i) {
      c.classList.add("rp");
      c.style.setProperty("--rp-d", (i * 1.1).toFixed(2) + "s");
    });
    setTimeout(function () { slot.classList.remove("is-on"); }, 1300 + cards.length * 1100);
  }).observe(results, { childList: true });
});
