/* ============================================================
   MODULE — timeline  (programme.html)
   The evening as a ribbon: a row of stops joined by a line that
   draws in on scroll. On the day of the fair a "now" marker sits
   on the line at the current time; before and after, the ribbon
   just shows the running order.

   Markup:  <div data-timeline></div>
   Config:  program.timeline[] { at:"HH:MM", label, note }
            eventDate  (ISO, for the "now" marker)
   ============================================================ */
Vim.register("timeline", function (ctx) {
  var host = ctx.$("[data-timeline]");
  if (!host) return;

  var P = (ctx.year && ctx.year.program) || {};
  var stops = (P.timeline || []).filter(function (s) { return s && s.at && s.label; });
  if (stops.length < 2) { var sec = host.closest("section"); if (sec) sec.hidden = true; return; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function pretty(hhmm) {
    var p = hhmm.split(":"), h = +p[0], m = +p[1] || 0;
    var ap = h < 12 ? "am" : "pm", hr = h % 12 || 12;
    return hr + (m ? ":" + (m < 10 ? "0" + m : m) : "") + " " + ap;
  }

  host.innerHTML =
    '<ol class="timeline__track" data-tl-track>' +
      stops.map(function (s, i) {
        return '<li class="timeline__stop" style="--i:' + i + '">' +
          '<span class="timeline__dot" aria-hidden="true"></span>' +
          '<span class="timeline__at">' + esc(pretty(s.at)) + '</span>' +
          '<span class="timeline__label">' + esc(s.label) + '</span>' +
          (s.note ? '<span class="timeline__note">' + esc(s.note) + '</span>' : '') +
        '</li>';
      }).join("") +
    '</ol>' +
    '<div class="timeline__now" data-tl-now hidden><span class="timeline__now-dot"></span>' +
      '<span class="timeline__now-label">Happening now</span></div>' +
    '<p class="timeline__foot" data-tl-foot></p>';

  var track = host.querySelector("[data-tl-track]");
  var nowEl = host.querySelector("[data-tl-now]");
  var footEl = host.querySelector("[data-tl-foot]");

  /* ---- where are we, relative to the evening? ---- */
  function stopDate(base, hhmm) {
    var p = hhmm.split(":");
    var d = new Date(base.getTime());
    d.setHours(+p[0], +p[1] || 0, 0, 0);
    return d;
  }
  function placeNow() {
    var ev = ctx.year && ctx.year.eventDate ? new Date(ctx.year.eventDate) : null;
    if (!ev || isNaN(ev)) { footEl.textContent = "Times are announced closer to the date."; return; }

    var now = new Date();
    var first = stopDate(ev, stops[0].at);
    var last = stopDate(ev, stops[stops.length - 1].at);
    var sameDay = now.getFullYear() === ev.getFullYear() &&
                  now.getMonth() === ev.getMonth() && now.getDate() === ev.getDate();

    if (!sameDay || now < first) {
      var when = ev.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
      footEl.textContent = "The fair runs " + pretty(stops[0].at) + " to " + pretty(stops[stops.length - 1].at) + " on " + when + ".";
      return;
    }
    if (now > last) { footEl.textContent = "That's a wrap. Thank you for coming."; return; }

    // between two stops — position the marker across equal-width segments
    var seg = 1 / (stops.length - 1), frac = 0, active = 0;
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stopDate(ev, stops[i].at), b = stopDate(ev, stops[i + 1].at);
      if (now >= a && now < b) { active = i; frac = (now - a) / (b - a); break; }
      if (now >= b) active = i + 1;
    }
    var pos = Math.min(1, (active + frac) * seg);
    host.style.setProperty("--now", (pos * 100).toFixed(1) + "%");
    host.style.setProperty("--now-n", pos.toFixed(4));
    nowEl.hidden = false;
    track.classList.add("is-live");
    var cur = stops[Math.min(active, stops.length - 1)];
    footEl.textContent = cur ? "On now: " + cur.label + (cur.note ? ". " + cur.note : "") : "";
  }
  placeNow();
  setInterval(placeNow, 60000);

  /* ---- draw the line on scroll ---- */
  if (ctx.reducedMotion || !("IntersectionObserver" in window)) {
    track.classList.add("is-drawn");
    return;
  }
  new IntersectionObserver(function (es, obs) {
    es.forEach(function (e) {
      if (e.isIntersecting) { track.classList.add("is-drawn"); obs.disconnect(); }
    });
  }, { threshold: 0.3 }).observe(track);
});
