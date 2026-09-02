/* ============================================================
   MODULE — motion (scroll reveal + stagger)
   Markup:
     <div data-animate="fade-up">                     one element
     <div data-animate-stagger>                        cascade children
        <div data-animate="fade-up">...                (auto-delayed)
     data-animate-delay="0.15"                         manual delay (seconds)
     data-animate-once="false"                         re-run every time it enters
   ============================================================ */
Vim.register("motion", function (ctx) {
  var STEP = 0.08; // seconds between staggered children

  /* assign stagger delays */
  ctx.$$("[data-animate-stagger]").forEach(function (group) {
    var base = parseFloat(group.getAttribute("data-animate-delay")) || 0;
    ctx.$$("[data-animate]", group).forEach(function (child, i) {
      if (!child.style.getPropertyValue("--animate-delay")) {
        child.style.setProperty("--animate-delay", (base + i * STEP).toFixed(2) + "s");
      }
    });
  });

  /* manual delays */
  ctx.$$("[data-animate][data-animate-delay]").forEach(function (el) {
    if (!el.closest("[data-animate-stagger]")) {
      el.style.setProperty("--animate-delay", parseFloat(el.getAttribute("data-animate-delay")) + "s");
    }
  });

  var targets = ctx.$$("[data-animate]");
  if (!targets.length) return;

  if (ctx.reducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var once = en.target.getAttribute("data-animate-once") !== "false";
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        if (once) io.unobserve(en.target);
      } else if (!once) {
        en.target.classList.remove("is-in");
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  targets.forEach(function (el) { io.observe(el); });

  /* failsafe — never leave content invisible if the observer never fires
     (broken IO, page loaded in a background tab that never regains focus,
     unusual embed contexts). Reveals anything still pending. */
  setTimeout(function () {
    ctx.$$("[data-animate]:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); });
  }, 4000);
});
