/* ============================================================
   MODULE — moviespage  (movies.html)
   The poster wall + the hero chips. Each film in program.screenings
   gets a poster card: its own `poster` image if one is set, otherwise a
   typographic poster drawn in CSS (a palette per slot, so the wall
   reads as a set). A light sweeps across a poster under the cursor.
   Must load before motion.js so the cards get their reveal.
   ============================================================ */
Vim.register("moviespage", function (ctx) {
  var wall = ctx.$("[data-cine-posters]");
  if (!wall) return;
  var P = ctx.year.program || {};
  var films = (P.screenings || []).filter(function (s) { return s.title; });

  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function venueLabel(v) {
    var zones = ((ctx.year.venueMap || {}).zones) || [];
    for (var i = 0; i < zones.length; i++) if (zones[i].venue === v) return ctx.L(zones[i].label);
    return v || ctx.t("venuemap.roomSoon");
  }

  wall.innerHTML = films.map(function (f, i) {
    /* "Fall 2: Deadpoint" → big "Fall 2", small "Deadpoint" */
    var parts = String(f.title).split(/:\s*/);
    var main = parts[0], sub = parts.slice(1).join(": ");
    var face = f.poster
      ? '<img class="cine-poster__img" src="' + esc(f.poster) + '" alt="" loading="lazy" decoding="async">'
      : '<div class="cine-poster__art" aria-hidden="true"><i></i><i></i></div>' +
        '<div class="cine-poster__type">' +
          '<span class="cine-poster__no">' + String(i + 1).padStart(2, "0") + '</span>' +
          '<span class="cine-poster__main">' + esc(main) + '</span>' +
          (sub ? '<span class="cine-poster__sub">' + esc(sub) + '</span>' : '') +
        '</div>';
    return '<li class="cine-poster cine-poster--p' + (i % 5) + '" data-animate="fade-up" data-animate-delay="' + (i * 0.07).toFixed(2) + '">' +
      '<div class="cine-poster__frame">' + face +
        '<span class="cine-poster__glare" aria-hidden="true"></span>' +
        '<span class="cine-poster__strip" aria-hidden="true">Vimusement ' + esc(ctx.year.year || "") + '</span>' +
      '</div>' +
      '<div class="cine-poster__meta">' +
        '<h3 class="cine-poster__title">' + esc(f.title) + (f.rating ? ' <span class="cine-rating">' + esc(f.rating) + '</span>' : '') + '</h3>' +
        '<p class="cine-poster__when">' + esc(venueLabel(f.venue)) + ' · ' + esc(f.time || ctx.t("movies.timeTbc")) + '</p>' +
      '</div>' +
    '</li>';
  }).join("");

  /* glare follows the cursor across a poster */
  if (!ctx.reducedMotion) {
    ctx.$$(".cine-poster__frame", wall).forEach(function (fr) {
      fr.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = fr.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        fr.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        fr.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
        fr.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
        fr.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
      });
      fr.addEventListener("pointerleave", function () {
        fr.style.setProperty("--rx", "0deg"); fr.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* hero chips */
  var chips = ctx.$("[data-cine-chips]");
  if (chips) {
    var rooms = films.map(function (f) { return f.venue; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    var rows = [
      [String(films.length), ctx.t(films.length === 1 ? "movies.chip.film" : "movies.chip.films")],
      [rooms.length === 1 ? venueLabel(rooms[0]) : String(rooms.length || "?"), rooms.length === 1 ? ctx.t("movies.chip.room") : ctx.t("movies.chip.rooms")],
      [ctx.t("movies.chip.dateVal"), ctx.t("movies.chip.date")]
    ];
    chips.innerHTML = rows.map(function (r) { return '<li class="cine-chip"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></li>'; }).join("");
  }

  var ig = ((ctx.site.social || {}).instagram) || "";
  ctx.$$("[data-cine-follow]").forEach(function (a) { if (ig) a.href = ig; else a.remove(); });
});
