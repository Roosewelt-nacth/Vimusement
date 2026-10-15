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
  /* labels baked into the hand-traced SVG plan itself — "|" is box()'s
     own line-break separator, kept in the Tamil values too */
  var PLAN_TA = {
    "Stall": "கடை",
    "ENTRY": "நுழைவு",
    "Church": "தேவாலயம்",
    "Basement": "பேஸ்மென்ட்",
    "Gifts|&amp; tickets": "பரிசுகள்|& சீட்டுகள்",
    "Chapel": "தேவாலய அறை",
    "Food Counter": "உணவு கவுண்டர்",
    "AV Room|3rd floor": "AV அறை|3வது மாடி",
    "Center of|Attraction": "முக்கிய|கவர்ச்சி மையம்",
    "Entry": "நுழைவு"
  };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* Grounds plan, traced from the committee's layout sketch. viewBox
     0 0 720 900 (portrait). 27 numbered slots 1 to 27 (committee layout v12: the corner slots are
     dropped; stalls, games 12 to 19, the tiffin stall takes 26 and 27) around a centred "Center of
     Attraction", the church block up top (Basement + Gifts & tickets +
     Chapel), the AV Room (upstairs) beside stalls 16–19, Food Counter,
     Entry at the foot. Every interactive area is
     <g class="vm-zone" data-zone="…">; stalls are data-zone="s1".."s27".
     Replace wholesale by setting venueMap.planImage to a traced SVG that
     keeps the same data-zone ids. */
  var STALLS = [
    [1, 610, 669, 74, 77, "stall"],
    [2, 610, 592, 74, 77, "stall"],
    [3, 610, 514, 74, 78, "stall"],
    [4, 610, 436, 74, 78, "stall"],
    [5, 610, 358, 74, 78, "stall"],
    [6, 610, 280, 74, 78, "stall"],
    [7, 536, 224, 74, 56, "stall"],
    [8, 462, 224, 74, 56, "stall"],
    [9, 404, 482, 82, 66, "stall"],
    [10, 404, 548, 82, 66, "stall"],
    [11, 404, 614, 82, 66, "game"],
    [12, 404, 680, 82, 66, "game"],
    [13, 305, 746, 99, 60, "game"],
    [14, 205, 746, 100, 60, "game"],
    [15, 106, 746, 99, 60, "game"],
    [16, 22, 681, 84, 65, "game"],
    [17, 22, 616, 84, 65, "game"],
    [18, 22, 551, 84, 65, "game"],
    [19, 22, 486, 84, 65, "game"],
    [20, 22, 382, 84, 60, "stall"],
    [21, 22, 322, 84, 60, "stall"],
    [22, 22, 262, 84, 60, "stall"],
    [23, 22, 202, 84, 60, "stall"],
    [24, 22, 142, 84, 60, "stall"],
    [25, 22, 82, 84, 60, "stall"],
    [26, 112, 22, 86, 60, "stall"],
    [27, 198, 22, 86, 60, "stall"]
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

  function stat(x, y, w, h, label, dashed) {
    var lines = label.split("|");
    return '<g class="vm-static" aria-hidden="true"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"' + (dashed ? ' stroke-dasharray="4 3"' : '') + '/>' +
      lines.map(function (ln, i) { return '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4 + (i - (lines.length - 1) / 2) * 12) + '" text-anchor="middle">' + ln + '</text>'; }).join("") + '</g>';
  }

  function builtinPlan(ctx) {
    var t = function (en) { return ctx && ctx.lang === "ta" ? PLAN_TA[en] || en : en; };
    var short = (ctx && ctx.year && ctx.year.venueMap && ctx.year.venueMap.stalls) || {};
    var stalls = STALLS.map(function (s) {
      var info = short[s[0]] || {}, nm = info.short ? String(info.short).split("|") : [];
      var label = (s[5] === "game" ? "Game " : s[5] === "food" ? "Food counter " : t("Stall") + " ") + s[0];
      var cx = s[1] + s[3] / 2, num = '<text x="' + cx + '" y="' + (s[2] + (nm.length ? 20 : s[4] / 2 + 5)) + '" text-anchor="middle">' + s[0] + '</text>';
      var sub = nm.map(function (ln, i) { return '<text class="vm-sub" x="' + cx + '" y="' + (s[2] + 33 + i * 10) + '" text-anchor="middle">' + ln + '</text>'; }).join("");
      var tag = s[5] === "game" ? '<text class="vm-sub" x="' + cx + '" y="' + (s[2] + s[4] / 2 + 14) + '" text-anchor="middle">GAME</text>' : s[5] === "food" ? '<text class="vm-sub" x="' + cx + '" y="' + (s[2] + s[4] / 2 + 14) + '" text-anchor="middle">FOOD</text>' : "";
      return '<g class="vm-zone vm-zone--stall vm-zone--' + s[5] + '" data-zone="s' + s[0] + '" tabindex="0" role="button" aria-label="' + label + '">' +
        '<rect x="' + s[1] + '" y="' + s[2] + '" width="' + s[3] + '" height="' + s[4] + '" rx="4"/>' + num + sub + tag +
      '</g>';
    }).join("");

    return '' +
    '<svg class="vm-svg" viewBox="0 0 720 900" role="group" aria-label="Grounds plan">' +
      '<defs><pattern id="vmGrass" width="24" height="24" patternUnits="userSpaceOnUse">' +
        '<rect width="24" height="24" fill="var(--vm-grass)"/>' +
        '<circle cx="6" cy="6" r="1" fill="var(--vm-grass-dot)"/>' +
        '<circle cx="17" cy="16" r="1" fill="var(--vm-grass-dot)"/>' +
      '</pattern></defs>' +

      '<rect x="12" y="12" width="696" height="864" rx="16" fill="url(#vmGrass)" stroke="var(--vm-edge)"/>' +
      /* the entry gap at the foot */
      '<rect x="470" y="872" width="120" height="10" fill="var(--vm-grass)"/>' +
      '<text x="530" y="892" class="vm-note" text-anchor="middle">' + t("ENTRY") + '</text>' +

      /* church block, centred on the grounds (canvas centre x=320) */
      '<g aria-hidden="true"><rect x="308" y="16" width="52" height="270" fill="var(--vm-build)" stroke="var(--vm-build-edge)"/>' +
        '<path d="M334 4l12 12h-24z" fill="var(--vm-build)" stroke="var(--vm-build-edge)"/></g>' +
      box("church",  308, 220, 52, 66, t("Church"), "vm-zone--tall") +
      box("basement", 178, 290, 96, 66, t("Basement")) +
      box("tickets",  274, 290, 96, 66, t("Gifts|&amp; tickets")) +
      box("chapel",   370, 290, 92, 66, t("Chapel")) +
      /* service areas, not tappable */
      stat(256, 362, 84, 76, "Help &amp;|donate desk") +
      stat(296, 444, 44, 32, "Gate", true) +
      stat(400, 128, 148, 86, "Service yard|staff only", true) +
      stat(170, 190, 120, 90, "Seating|(food court)") +
      /* AV Room is upstairs (3rd floor), above stalls 16 to 19 */
      box("av",       22, 446, 84, 36, t("AV Room|3rd floor"), "vm-zone--up") +
      box("center", 170, 480, 170, 200, t("Center of|Attraction"), "vm-zone--hero") +
      box("entry",  430, 816, 150, 44, t("Entry")) +

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
    if (captionEl && M.caption) captionEl.textContent = ctx.L(M.caption);

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
          esc(ctx.L(P.screeningsNote) || ctx.t("venuemap.lineupSoon")) + '</p>';
      } else {
        var scrIcons = window.VIM_ICONS || {};
        scheduleEl.innerHTML = scrTitled.map(function (s) {
          return '<li class="vm-scr">' +
            (scrIcons.movie ? '<span class="vm-scr__icon" aria-hidden="true">' + scrIcons.movie + '</span>' : '') +
            (s.time ? '<span class="vm-scr__time">' + esc(s.time) + '</span>' : '') +
            '<span class="vm-scr__title">' + esc(s.title) +
              (s.rating ? ' <span class="vm-panel__tag">' + esc(s.rating) + '</span>' : '') + '</span>' +
            (s.venue
              ? '<button type="button" class="vm-scr__venue" data-zone="' + esc(venueToZone(s.venue)) + '">' + esc(zoneLabel(s.venue)) + '</button>'
              : '<span class="vm-scr__venue vm-scr__venue--tba">' + esc(ctx.t("venuemap.roomSoon")) + '</span>') +
          '</li>';
        }).join("");
        /* some rooms/times still open — say so once, under the list */
        if (scrTitled.some(function (s) { return !s.time || !s.venue; }) && P.screeningsNote) {
          scheduleEl.insertAdjacentHTML("afterend", '<p class="venuemap__screenings-note">' + esc(ctx.L(P.screeningsNote)) + '</p>');
        }
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
    /* venue is a plain matching key (see file-top note) — resolve it back
       to the zone's translated display label wherever it's actually shown */
    function zoneLabel(venue) {
      for (var i = 0; i < zones.length; i++) if (String(zones[i].venue) === String(venue)) return ctx.L(zones[i].label);
      return venue;
    }

    /* ---- games grouped by area ---- */
    var gamesEl = ctx.$("[data-venuemap-games]");
    if (gamesEl) {
      var games = P.games || [];
      if (!games.length) { gamesEl.hidden = true; }
      else {
        var gIcons = window.VIM_ICONS || {};
        var gameIcon = gIcons.games ? '<span class="vm-games-icon" aria-hidden="true">' + gIcons.games + '</span>' : '';
        var groups = {};
        games.forEach(function (g) { (groups[g.venue] = groups[g.venue] || []).push(ctx.L(g.name)); });
        gamesEl.innerHTML = '<h3 class="venuemap__games-title">' + ctx.t("venuemap.gamesByArea") + '</h3>' +
          Object.keys(groups).map(function (v) {
            return '<div class="vm-games-group">' +
              '<button type="button" class="vm-games-venue" data-zone="' + esc(venueToZone(v)) + '">' + esc(zoneLabel(v)) + '</button>' +
              '<ul>' + groups[v].map(function (n) { return '<li>' + gameIcon + esc(n) + '</li>'; }).join("") + '</ul>' +
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
        .catch(function () { planBox.innerHTML = builtinPlan(ctx); wire(); select(zones[0].id); });
    } else {
      planBox.innerHTML = builtinPlan(ctx);
      wire();
    }

    /* ---- legend ---- */
    if (legend) {
      legend.innerHTML = zones.map(function (z) {
        return '<li><button type="button" class="vm-chip" data-zone="' + z.id + '">' + esc(ctx.L(z.label)) + '</button></li>';
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
    /* booking mode (stalls.html, <div data-venuemap data-venuemap-book>): open
       stalls glow, and an open stall's panel gets a "Book this spot" button that
       opens WhatsApp with the stall number already in the message */
    var book = host.hasAttribute("data-venuemap-book");
    var bookWa = (((Y.stalls || {}).contactWhatsApp) || "").split("?")[0];
    var kindOf = {}; STALLS.forEach(function (x) { kindOf[x[0]] = x[5]; });
    /* a slot is "taken" once named; a slot with only one half taken (info.open) stays bookable */
    function taken(n) { var i = stalls[n] || stalls[+n]; return !!(i && (i.for || i.name || i.lines)) && !i.open; }
    function bookable(n) { return kindOf[n] === "stall" && !taken(n); }
    function tt(key, fallback) { var v = ctx.t(key); return v === key ? fallback : v; }
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
        var n = stallN[1], info = stalls[n] || stalls[+n], kind = kindOf[n] || "stall";
        var sh = '<h3 class="vm-panel__title">' + (kind === "game" ? tt("venuemap.gameSlot", "Game") : kind === "food" ? tt("venuemap.foodSlot", "Food counter") : ctx.t("venuemap.stall")) + ' ' + n + '</h3>';
        if (kind === "game") {
          sh += '<p class="vm-panel__blurb">' + esc(tt("venuemap.gameSlotNote", "A game stall run by Victorians Youth. Buy tokens at the gate.")) + '</p>';
        } else if (kind === "food") {
          sh += '<p class="vm-panel__blurb">' + esc(ctx.L((byId.food || {}).blurb || "")) + '</p>';
        } else if (info && (info.for || info.name || info.lines)) {
          (info.lines || [{ name: info.name || info.for, for: info.name ? info.for : "", by: info.by }]).forEach(function (ln) {
            sh += '<p class="vm-panel__blurb"><strong>' + esc(ln.name || ln.for) + '</strong>' + (ln.name && ln.for ? '<br>' + esc(ln.for) : '') + (ln.by ? ' &middot; ' + esc(ln.by) : '') + '</p>';
          });
          if (info.open && book) {
            var msgH = tt("stallbook.msg", "Hi Janet, I'd like to book stall {n} at Vimusement 2026.").replace("{n}", n);
            sh += '<p class="vm-panel__open"><span class="vm-panel__open-dot" aria-hidden="true"></span>' + esc(tt("stallbook.openHalf", "One half is still open")) + '</p>' +
              (bookWa ? '<a class="btn btn--gold vm-panel__book" target="_blank" rel="noopener" href="' + esc(bookWa + "?text=" + encodeURIComponent(msgH)) + '">' + esc(tt("stallbook.cta", "Book this spot")) + '</a>' : '');
          }
        } else if (book) {
          var msg = tt("stallbook.msg", "Hi Janet, I'd like to book stall {n} at Vimusement 2026.").replace("{n}", n);
          sh += '<p class="vm-panel__open"><span class="vm-panel__open-dot" aria-hidden="true"></span>' + esc(tt("stallbook.open", "Open")) + '</p>' +
            '<p class="vm-panel__blurb">' + esc(tt("stallbook.rates", "Full stall from ₹5,500, half from ₹3,500. Benches and power included.")) + '</p>' +
            (bookWa ? '<a class="btn btn--gold vm-panel__book" target="_blank" rel="noopener" href="' + esc(bookWa + "?text=" + encodeURIComponent(msg)) + '">' +
              esc(tt("stallbook.cta", "Book this spot")) + '</a>' : '');
        } else {
          sh += '<p class="vm-panel__empty">' + ctx.t("venuemap.notAssigned") + '</p>';
        }
        panel.innerHTML = sh;
        if (book && !ctx.reducedMotion) { panel.classList.remove("is-swap"); void panel.offsetWidth; panel.classList.add("is-swap"); }
        return;
      }

      var screenings = forVenue(P.screenings, z.venue);
      var titled = screenings.filter(function (s) { return s.title; });
      var games = forVenue(P.games, z.venue);
      var html = '<h3 class="vm-panel__title">' + esc(ctx.L(z.label)) + '</h3>';
      if (z.blurb) html += '<p class="vm-panel__blurb">' + esc(ctx.L(z.blurb)) + '</p>';

      if (titled.length) {
        html += '<h4 class="vm-panel__h">' + ctx.t("venuemap.screenings") + '</h4><ul class="vm-panel__list">' +
          titled.map(function (s) {
            return '<li>' + (s.time ? '<span class="vm-panel__time">' + esc(s.time) + '</span> ' : '') +
              esc(s.title) + (s.rating ? ' <span class="vm-panel__tag">' + esc(s.rating) + '</span>' : '') + '</li>';
          }).join("") + '</ul>';
      } else if (screenings.length) {
        html += '<h4 class="vm-panel__h">' + ctx.t("venuemap.screenings") + '</h4><p class="vm-panel__list">' +
          ctx.t(screenings.length === 1 ? "venuemap.filmCount.one" : "venuemap.filmCount.many").replace("{n}", screenings.length) +
          ' ' + ctx.t("venuemap.lineupSoon") + '</p>';
      }
      if (games.length) {
        html += '<h4 class="vm-panel__h">' + ctx.t("venuemap.games") + '</h4><ul class="vm-panel__list">' +
          games.map(function (g) { return '<li>' + esc(ctx.L(g.name)) + '</li>'; }).join("") + '</ul>';
      }
      if (!screenings.length && !games.length) {
        html += '<p class="vm-panel__empty">' + ctx.t("venuemap.detailsSoon") + '</p>';
      }
      panel.innerHTML = html;
    }

    /* "who's where": one button per named stall, so a vendor can find their number */
    var roster = ctx.$("[data-venuemap-roster]");
    if (roster) {
      var rows = [];
      Object.keys(stalls).map(Number).sort(function (a, b) { return a - b; }).forEach(function (n) {
        var i = stalls[n]; if (!i) return;
        (i.lines || [{ name: i.name || i.for }]).forEach(function (ln) { if (ln.name && !ln.tbc) rows.push([n, ln.name]); });
      });
      roster.innerHTML = rows.map(function (r) {
        return '<li><button type="button" class="vm-roster__b" data-zone="s' + r[0] + '"><span class="vm-roster__n">' + r[0] + '</span>' + esc(r[1]) + '</button></li>';
      }).join("");
      ctx.$$(".vm-roster__b", roster).forEach(function (b) {
        b.addEventListener("click", function () { select(b.getAttribute("data-zone")); planBox.scrollIntoView({ behavior: "smooth", block: "center" }); });
      });
    }

    // start on the entry / first zone so the panel is never empty
    if (book) {
      host.classList.add("is-booking");
      ctx.$$(".vm-zone--stall", planBox).forEach(function (g) {
        var n = g.getAttribute("data-zone").slice(1);
        g.classList.toggle("is-open", bookable(n) || (kindOf[n] === "stall" && !!(stalls[n] && stalls[n].open)));
      });
    }
    if (book) { for (var k = 1; k <= 27; k++) if (bookable(k)) { select("s" + k); break; } }
    else select(zones[0].id);
  });
})();
