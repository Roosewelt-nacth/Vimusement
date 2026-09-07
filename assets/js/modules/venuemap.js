/* ============================================================
   MODULE — venuemap
   An interactive top-down plan of the grounds. Tap a zone to see
   what's screening / which games are run there, pulled from
   VIM_YEAR.program by matching zone.venue.

   Markup (index.html):
     <div data-venuemap>
       <div data-venuemap-plan></div>       <- SVG injected here
       <aside data-venuemap-panel></aside>  <- detail for the picked zone
     </div>
     <ol data-venuemap-legend></ol>
     <p data-venuemap-caption></p>           (optional)

   Config:
     venueMap.zones[]  { id, label, venue, blurb }
     venueMap.planImage  optional URL of a traced SVG (same data-zone ids)
     program.screenings[] { title, time, venue, rating? }
     program.games[]      { name, venue }
   ============================================================ */
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* Grounds plan, traced from the committee's layout sketch. viewBox
     0 0 640 900 (portrait). 27 numbered stalls (1–27, sequential — the
     two that didn't exist on the ground were dropped and everything
     renumbered down to close the gap) around a centred "Center of
     Attraction", the church block up top (Basement + Gifts & tickets +
     Chapel), the AV Room (upstairs) beside stalls 17–20, Food Counter,
     Entry at the foot. Every interactive area is
     <g class="vm-zone" data-zone="…">; stalls are data-zone="s1".."s27".
     Replace wholesale by setting venueMap.planImage to a traced SVG that
     keeps the same data-zone ids. */
  var STALLS = [
    [27, 44, 100, 66, 48], [26, 44, 150, 66, 48], [25, 44, 200, 66, 48], [24, 44, 250, 66, 48], [23, 44, 300, 66, 48],
    [22, 14, 388, 78, 46], [21, 14, 436, 78, 46],
    [20, 120, 470, 80, 52], [19, 120, 524, 80, 52], [18, 120, 578, 80, 52], [17, 120, 632, 80, 52],
    [16, 162, 702, 96, 56], [15, 260, 702, 96, 56], [14, 358, 702, 96, 56],
    [9, 432, 452, 68, 48], [10, 432, 502, 68, 48], [11, 432, 552, 68, 48], [12, 432, 602, 68, 48], [13, 432, 652, 68, 48],
    [8, 540, 342, 74, 44], [7, 540, 388, 74, 44], [6, 540, 434, 74, 44],
    [5, 540, 480, 74, 44], [4, 540, 526, 74, 44], [3, 540, 572, 74, 44], [2, 540, 618, 74, 44], [1, 540, 664, 74, 44]
  ];

  function box(id, x, y, w, h, label, cls) {
    var lines = String(label).split("|");
    var t = lines.map(function (ln, i) {
      var dy = (i - (lines.length - 1) / 2) * 15 + 4;
      return '<tspan x="' + (x + w / 2) + '" dy="' + (i === 0 ? dy : 15) + '">' + ln + '</tspan>';
    }).join("");
    return '<g class="vm-zone' + (cls ? " " + cls : "") + '" data-zone="' + id + '" tabindex="0" role="button" aria-label="' +
      String(label).replace(/\|/g, " ").replace(/&[^;]+;/g, "and") + '">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"/>' +
      '<text text-anchor="middle" y="' + (y + h / 2) + '">' + t + '</text>' +
    '</g>';
  }

  function builtinPlan() {
    var stalls = STALLS.map(function (s) {
      return '<g class="vm-zone vm-zone--stall" data-zone="s' + s[0] + '" tabindex="0" role="button" aria-label="Stall ' + s[0] + '">' +
        '<rect x="' + s[1] + '" y="' + s[2] + '" width="' + s[3] + '" height="' + s[4] + '" rx="4"/>' +
        '<text x="' + (s[1] + s[3] / 2) + '" y="' + (s[2] + s[4] / 2 + 5) + '" text-anchor="middle">' + s[0] + '</text>' +
      '</g>';
    }).join("");

    return '' +
    '<svg class="vm-svg" viewBox="0 0 640 900" role="group" aria-label="Grounds plan">' +
      '<defs><pattern id="vmGrass" width="24" height="24" patternUnits="userSpaceOnUse">' +
        '<rect width="24" height="24" fill="var(--vm-grass)"/>' +
        '<circle cx="6" cy="6" r="1" fill="var(--vm-grass-dot)"/>' +
        '<circle cx="17" cy="16" r="1" fill="var(--vm-grass-dot)"/>' +
      '</pattern></defs>' +

      '<rect x="12" y="12" width="616" height="864" rx="16" fill="url(#vmGrass)" stroke="var(--vm-edge)"/>' +
      /* the entry gap at the foot */
      '<rect x="470" y="872" width="120" height="10" fill="var(--vm-grass)"/>' +
      '<text x="530" y="892" class="vm-note" text-anchor="middle">ENTRY</text>' +

      /* church block — centered on the grounds (canvas centre x=320) */
      '<g aria-hidden="true"><rect x="308" y="16" width="52" height="270" fill="var(--vm-build)" stroke="var(--vm-build-edge)"/>' +
        '<path d="M334 4l12 12h-24z" fill="var(--vm-build)" stroke="var(--vm-build-edge)"/></g>' +
      box("church",  308, 220, 52, 66, "Church", "vm-zone--tall") +
      box("basement", 178, 290, 96, 66, "Basement") +
      box("tickets",  274, 290, 96, 66, "Gifts|&amp; tickets") +
      box("chapel",   370, 290, 92, 66, "Chapel") +

      box("food",   22, 18, 278, 58, "Food Counter") +
      /* AV Room sits on the left of the 19–22 stall column, same
         floor footprint — it's upstairs (3rd floor) above that block */
      box("av",       44, 482, 70, 202, "AV Room|3rd floor", "vm-zone--up") +
      box("center", 214, 456, 196, 236, "Center of|Attraction", "vm-zone--hero") +
      box("entry",  430, 802, 150, 48, "Entry") +

      stalls +
    '</svg>';
  }

  Vim.register("venuemap", function (ctx) {
    var host = ctx.$("[data-venuemap]");
    if (!host) return;

    var Y = ctx.year || {};
    var M = Y.venueMap || {};
    var P = Y.program || {};
    var zones = M.zones || [];
    if (!zones.length) { host.closest("section") && (host.closest("section").hidden = true); return; }

    var planBox = ctx.$("[data-venuemap-plan]");
    var panel = ctx.$("[data-venuemap-panel]");
    var legend = ctx.$("[data-venuemap-legend]");
    var scheduleEl = ctx.$("[data-venuemap-schedule]");
    var captionEl = ctx.$("[data-venuemap-caption]");
    if (captionEl && M.caption) captionEl.textContent = M.caption;

    var scrAll = P.screenings || [];
    var scrTitled = scrAll.filter(function (s) { return s.title; });

    /* ---- full screening line-up ---- */
    if (scheduleEl) {
      var wrap = scheduleEl.closest(".venuemap__schedule");
      if (!scrAll.length) {
        if (wrap) wrap.hidden = true;
      } else if (!scrTitled.length) {
        // no titles yet — one line instead of a list of blanks
        scheduleEl.outerHTML = '<p class="venuemap__screenings-note">' +
          esc(P.screeningsNote || "The line-up is announced closer to the date.") + '</p>';
      } else {
        scheduleEl.innerHTML = scrTitled.map(function (s) {
          return '<li class="vm-scr">' +
            (s.time ? '<span class="vm-scr__time">' + esc(s.time) + '</span>' : '') +
            '<span class="vm-scr__title">' + esc(s.title) +
              (s.rating ? ' <span class="vm-panel__tag">' + esc(s.rating) + '</span>' : '') + '</span>' +
            '<button type="button" class="vm-scr__venue" data-zone="' + esc(venueToZone(s.venue)) + '">' +
              esc(s.venue) + '</button>' +
          '</li>';
        }).join("");
        ctx.$$(".vm-scr__venue", scheduleEl).forEach(function (b) {
          b.addEventListener("click", function () {
            var id = b.getAttribute("data-zone");
            if (id) { select(id); host.scrollIntoView({ behavior: "smooth", block: "start" }); }
          });
        });
      }
    }
    function venueToZone(venue) {
      for (var i = 0; i < zones.length; i++) if (String(zones[i].venue) === String(venue)) return zones[i].id;
      return "";
    }

    /* ---- games grouped by area ---- */
    var gamesEl = ctx.$("[data-venuemap-games]");
    if (gamesEl) {
      var games = P.games || [];
      if (!games.length) { gamesEl.hidden = true; }
      else {
        var groups = {};
        games.forEach(function (g) { (groups[g.venue] = groups[g.venue] || []).push(g.name); });
        gamesEl.innerHTML = '<h3 class="venuemap__games-title">Games by area</h3>' +
          Object.keys(groups).map(function (v) {
            return '<div class="vm-games-group">' +
              '<button type="button" class="vm-games-venue" data-zone="' + esc(venueToZone(v)) + '">' + esc(v) + '</button>' +
              '<ul>' + groups[v].map(function (n) { return '<li>' + esc(n) + '</li>'; }).join("") + '</ul>' +
            '</div>';
          }).join("");
        ctx.$$(".vm-games-venue", gamesEl).forEach(function (b) {
          b.addEventListener("click", function () {
            var id = b.getAttribute("data-zone");
            if (id) { select(id); host.scrollIntoView({ behavior: "smooth", block: "start" }); }
          });
        });
      }
    }

    var byId = {};
    zones.forEach(function (z) { byId[z.id] = z; });

    /* ---- inject the plan ---- */
    function wire() {
      ctx.$$(".vm-zone", planBox).forEach(function (g) {
        var id = g.getAttribute("data-zone");
        g.addEventListener("click", function () { select(id); });
        g.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(id); }
        });
      });
    }
    if (M.planImage) {
      fetch(M.planImage).then(function (r) { return r.text(); })
        .then(function (svg) { planBox.innerHTML = svg; wire(); select(zones[0].id); })
        .catch(function () { planBox.innerHTML = builtinPlan(); wire(); select(zones[0].id); });
    } else {
      planBox.innerHTML = builtinPlan();
      wire();
    }

    /* ---- legend ---- */
    if (legend) {
      legend.innerHTML = zones.map(function (z) {
        return '<li><button type="button" class="vm-chip" data-zone="' + z.id + '">' + esc(z.label) + '</button></li>';
      }).join("");
      ctx.$$(".vm-chip", legend).forEach(function (b) {
        b.addEventListener("click", function () { select(b.getAttribute("data-zone")); });
      });
    }

    /* ---- selection ---- */
    function forVenue(list, venue) {
      return (list || []).filter(function (x) { return String(x.venue) === String(venue); });
    }
    var stalls = M.stalls || {};
    function select(id) {
      var stallN = /^s(\d+)$/.exec(id);
      var z = stallN ? null : byId[id];
      if (!z && !stallN) return;

      ctx.$$(".vm-zone", planBox).forEach(function (g) {
        g.classList.toggle("is-active", g.getAttribute("data-zone") === id);
      });
      if (legend) ctx.$$(".vm-chip", legend).forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-zone") === id);
      });

      if (stallN) {
        var n = stallN[1], info = stalls[n] || stalls[+n];
        var sh = '<h3 class="vm-panel__title">Stall ' + n + '</h3>';
        if (info && (info.for || info.name)) {
          sh += '<p class="vm-panel__blurb">' + esc(info.for || info.name) +
            (info.by ? ' &middot; ' + esc(info.by) : '') + '</p>';
        } else {
          sh += '<p class="vm-panel__empty">Not assigned yet. Fancy this one? ' +
            'See &ldquo;Run a stall&rdquo; under Get Involved.</p>';
        }
        panel.innerHTML = sh;
        return;
      }

      var screenings = forVenue(P.screenings, z.venue);
      var titled = screenings.filter(function (s) { return s.title; });
      var games = forVenue(P.games, z.venue);
      var html = '<h3 class="vm-panel__title">' + esc(z.label) + '</h3>';
      if (z.blurb) html += '<p class="vm-panel__blurb">' + esc(z.blurb) + '</p>';

      if (titled.length) {
        html += '<h4 class="vm-panel__h">Screenings</h4><ul class="vm-panel__list">' +
          titled.map(function (s) {
            return '<li>' + (s.time ? '<span class="vm-panel__time">' + esc(s.time) + '</span> ' : '') +
              esc(s.title) + (s.rating ? ' <span class="vm-panel__tag">' + esc(s.rating) + '</span>' : '') + '</li>';
          }).join("") + '</ul>';
      } else if (screenings.length) {
        html += '<h4 class="vm-panel__h">Screenings</h4><p class="vm-panel__list">' +
          screenings.length + (screenings.length === 1 ? ' film here. ' : ' films here. ') +
          'Line-up announced closer to the date.</p>';
      }
      if (games.length) {
        html += '<h4 class="vm-panel__h">Games</h4><ul class="vm-panel__list">' +
          games.map(function (g) { return '<li>' + esc(g.name) + '</li>'; }).join("") + '</ul>';
      }
      if (!screenings.length && !games.length) {
        html += '<p class="vm-panel__empty">Details for this area are announced closer to the date.</p>';
      }
      panel.innerHTML = html;
    }

    // start on the entry / first zone so the panel is never empty
    select(zones[0].id);
  });
})();
