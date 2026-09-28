/* ============================================================
   MODULE — dayscrub  (programme.html)
   Drag through the day: a slider from gates-open to close. The sky
   over a small silhouette of the fair moves from dawn to night, the
   sun arcs across, the fair's lights come on at dusk, and the stop
   on the timeline below lights up with what's on at that hour.
   On the day of the fair it starts at the real time.
   Markup: <div data-dayscrub></div>   Data: program.timeline[]
   ============================================================ */
Vim.register("dayscrub", function (ctx) {
  var host = ctx.$("[data-dayscrub]");
  var stops = (((ctx.year || {}).program || {}).timeline || []).filter(function (s) { return s && s.at; });
  if (!host || stops.length < 2) return;
  function tt(key, fallback) { var v = ctx.t(key); return v === key ? fallback : v; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mins(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + (+p[1] || 0); }
  function pretty(m) { var h = Math.floor(m / 60), mm = m % 60, ap = h < 12 ? "am" : "pm"; return (h % 12 || 12) + ":" + (mm < 10 ? "0" : "") + mm + " " + ap; }
  var START = mins(stops[0].at), END = mins(stops[stops.length - 1].at);

  /* sky colours through the day: [minute, top, horizon] */
  var SKY = [[START, "#2F3B4C", "#C99A5E"], [660, "#4A7E97", "#B7D1CA"], [960, "#4E7B93", "#D9BA86"],
             [1080, "#34294A", "#C9754F"], [1170, "#0D1726", "#27364A"], [END, "#060A0F", "#111C16"]];
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t) { a = hex(a); b = hex(b); return "rgb(" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(",") + ")"; }
  function skyAt(m) {
    for (var i = 1; i < SKY.length; i++) if (m <= SKY[i][0]) {
      var t = (m - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]);
      return [mix(SKY[i - 1][1], SKY[i][1], t), mix(SKY[i - 1][2], SKY[i][2], t)];
    }
    return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
  }

  // the fair in silhouette: tents, a Ferris wheel, the church, and bulbs along a wire
  var lights = "";
  for (var i = 0; i <= 30; i++) { var x = 20 + i * 25.3, y = 88 + 8 * Math.sin(i / 30 * Math.PI); lights += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.2"/>'; }
  var spokes = "";
  for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; spokes += "M640 92 L" + (640 + 34 * Math.cos(a)).toFixed(1) + " " + (92 + 34 * Math.sin(a)).toFixed(1) + " "; }
  host.innerHTML =
    '<div class="dayscrub">' +
      '<svg class="dayscrub__sky" viewBox="0 0 800 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
        '<defs><linearGradient id="ds-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" data-ds-top/><stop offset="1" data-ds-low/></linearGradient></defs>' +
        '<rect width="800" height="150" fill="url(#ds-sky)"/>' +
        '<g class="dayscrub__stars" data-ds-stars>' +
          [[60, 22], [140, 44], [230, 16], [330, 38], [420, 20], [520, 46], [600, 14], [700, 34], [760, 58], [280, 62]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.2"/>'; }).join("") +
        '</g>' +
        '<circle class="dayscrub__sun" r="13" data-ds-sun/>' +
        '<g data-ds-moon><circle class="dayscrub__moon" r="10"/><circle class="dayscrub__moon-cut" r="9" cx="4" cy="-3" data-ds-cut/></g>' +
        '<g class="dayscrub__fair">' +
          '<circle cx="640" cy="92" r="36" fill="none" stroke-width="3"/><path d="' + spokes + '" stroke-width="1.6" fill="none"/>' +
          '<path d="M620 150 L640 92 L660 150" stroke-width="3" fill="none"/>' +
          '<path d="M0 150 V120 L30 104 L60 120 V150 Z M70 150 V116 L104 98 L138 116 V150 Z M230 150 V122 L262 106 L294 122 V150 Z M470 150 V118 L505 100 L540 118 V150 Z M700 150 V120 L735 104 L770 120 V150 Z"/>' +
          '<path d="M360 150 V92 L390 58 L420 92 V150 Z M388 58 V36 M381 44 H395"/>' +
        '</g>' +
        '<path class="dayscrub__wire" d="M20 88 Q 400 104 780 88" fill="none"/>' +
        '<g class="dayscrub__lights" data-ds-lights>' + lights + '</g>' +
      '</svg>' +
      '<div class="dayscrub__row">' +
        '<p class="dayscrub__read" aria-live="polite"><b data-ds-time></b> <span data-ds-what></span></p>' +
        '<label class="visually-hidden" for="ds-range">' + esc(tt("dayscrub.label", "Drag through the day")) + '</label>' +
        '<input id="ds-range" class="dayscrub__range" type="range" min="' + START + '" max="' + END + '" step="5" data-ds-range>' +
        '<p class="dayscrub__ends" aria-hidden="true"><span>' + pretty(START) + '</span><span>' + esc(tt("dayscrub.label", "Drag through the day")) + '</span><span>' + pretty(END) + '</span></p>' +
      '</div>' +
    '</div>';

  var range = ctx.$("[data-ds-range]", host), top = ctx.$("[data-ds-top]", host), low = ctx.$("[data-ds-low]", host);
  var sun = ctx.$("[data-ds-sun]", host), moon = ctx.$("[data-ds-moon]", host), stars = ctx.$("[data-ds-stars]", host);
  var lightsEl = ctx.$("[data-ds-lights]", host), timeEl = ctx.$("[data-ds-time]", host), whatEl = ctx.$("[data-ds-what]", host);
  var DUSK = mins("18:00"), SUNSET = mins("18:25");

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function arc(t, r) { return { x: 60 + 680 * t, y: 128 - r * Math.sin(Math.PI * t) }; }
  function set(m) {
    var c = skyAt(m); top.setAttribute("stop-color", c[0]); low.setAttribute("stop-color", c[1]);
    var st = clamp((m - START) / (SUNSET - START)), s = arc(st, 100);
    sun.setAttribute("cx", s.x.toFixed(1)); sun.setAttribute("cy", s.y.toFixed(1));
    sun.style.opacity = m > SUNSET ? 0 : 1;
    var mt = clamp((m - SUNSET) / (END + 120 - SUNSET)), mo = arc(.08 + mt * .6, 96);
    moon.setAttribute("transform", "translate(" + mo.x.toFixed(1) + " " + mo.y.toFixed(1) + ")");
    moon.style.opacity = clamp((m - SUNSET) / 30);
    ctx.$("[data-ds-cut]", host).setAttribute("fill", c[0]);
    stars.style.opacity = clamp((m - DUSK - 30) / 60);
    lightsEl.style.opacity = clamp((m - DUSK + 20) / 40);
    host.style.setProperty("--ds-p", ((m - START) / (END - START) * 100).toFixed(2) + "%");
    // what's on: the last stop that has started
    var cur = 0;
    for (var i = 0; i < stops.length; i++) if (mins(stops[i].at) <= m) cur = i;
    timeEl.textContent = pretty(m);
    var s0 = stops[cur];
    whatEl.textContent = ctx.L(s0.label) + (s0.note ? ". " + ctx.L(s0.note) : "");
    ctx.$$(".timeline__stop").forEach(function (li, i) { li.classList.toggle("is-scrub", i === cur); });
  }
  range.addEventListener("input", function () { set(+range.value); });

  // start at the real time on the day, otherwise at the gates opening
  var start = START, ev = new Date(ctx.year.eventDate || ""), now = new Date();
  if (!isNaN(ev) && now.toDateString() === ev.toDateString()) start = Math.min(END, Math.max(START, now.getHours() * 60 + now.getMinutes()));
  range.value = start;
  set(start);
  // a timeline drawn after us still gets its stop picked out
  setTimeout(function () { set(+range.value); }, 600);
});
