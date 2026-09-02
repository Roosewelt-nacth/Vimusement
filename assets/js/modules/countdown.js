/* ============================================================
   MODULE — countdown
   Markup: <div data-countdown> with children carrying
     data-cd="days|hours|minutes|seconds"
   Target date comes from VIM_YEAR.eventDate.
   ============================================================ */
Vim.register("countdown", function (ctx) {
  var root = ctx.$("[data-countdown]");
  if (!root || !ctx.year.eventDate) return;

  var target = new Date(ctx.year.eventDate).getTime();
  if (isNaN(target)) { console.warn("[Vim] bad eventDate"); return; }

  var cells = {
    days:    ctx.$('[data-cd="days"]', root),
    hours:   ctx.$('[data-cd="hours"]', root),
    minutes: ctx.$('[data-cd="minutes"]', root),
    seconds: ctx.$('[data-cd="seconds"]', root)
  };
  var label = ctx.$("[data-cd-label]", root);
  var pad = function (n) { return String(n).padStart(2, "0"); };

  function put(el, val) {
    if (!el || el.textContent === val) return;
    el.textContent = val;
    if (!ctx.reducedMotion) {
      el.classList.remove("is-flip");
      void el.offsetWidth;
      el.classList.add("is-flip");
    }
  }

  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      if (label) label.textContent = "The gates are open — welcome to Vimusement!";
      Object.keys(cells).forEach(function (k) { put(cells[k], "00"); });
      clearInterval(timer);
      return;
    }
    var s = Math.floor(diff / 1000);
    put(cells.days,    String(Math.floor(s / 86400)));
    put(cells.hours,   pad(Math.floor((s % 86400) / 3600)));
    put(cells.minutes, pad(Math.floor((s % 3600) / 60)));
    put(cells.seconds, pad(s % 60));
  }

  tick();
  var timer = setInterval(tick, 1000);
});
