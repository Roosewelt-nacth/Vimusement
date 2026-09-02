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

  var root = document.documentElement;

  function hardReveal() {
    /* snap EVERYTHING visible with no transition — the nuclear option, for
       when the whole reveal mechanism can't be trusted (no IO, bfcache
       restore, nothing revealed after a long wait). Kills scroll reveal. */
    root.classList.add("reveal-now");
    ctx.$$("[data-animate]:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); });
  }

  function unstickInView() {
    /* reveal + force-finish any reveal for elements on screen now, without
       touching below-the-fold elements so they still animate on scroll */
    var vh = window.innerHeight || root.clientHeight;
    ctx.$$("[data-animate]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      el.classList.add("is-in");
      if (el.getAnimations) el.getAnimations({ subtree: true }).forEach(function (a) {
        try { a.finish(); } catch (e) {}
      });
    });
  }

  if (ctx.reducedMotion || !("IntersectionObserver" in window)) {
    hardReveal();
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

  /* reveal what's already on screen synchronously, so the first paint is
     never a blank hero while we wait for the observer's first callback */
  var vh0 = window.innerHeight || root.clientHeight;
  targets.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < vh0 * 0.92 && r.bottom > 0) el.classList.add("is-in");
  });

  targets.forEach(function (el) { io.observe(el); });

  /* a tab hidden partway through the reveal keeps those transitions frozen
     at opacity 0 even after it comes back (and some mobiles stall the
     document timeline). When we're visible again, unstick what's on screen. */
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) unstickInView();
  });
  window.addEventListener("focus", unstickInView);
  window.addEventListener("pageshow", function (e) {
    e.persisted ? hardReveal() : unstickInView();
  });

  /* short failsafe: on-screen content must not stay blank. Doesn't touch
     below-the-fold elements, so scroll reveal keeps working. */
  setTimeout(unstickInView, 1200);
  /* long failsafe: if after several seconds nothing revealed at all, the
     observer is dead — snap the whole page visible. */
  setTimeout(function () {
    if (!ctx.$("[data-animate].is-in")) hardReveal();
  }, 6000);
});
