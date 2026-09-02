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

  /* Built-in placeholder plan. viewBox 0 0 880 560. Every interactive
     area is <g class="vm-zone" data-zone="…">. Swap the whole thing by
     setting venueMap.planImage to a traced SVG that keeps these ids. */
  function builtinPlan() {
    return '' +
    '<svg class="vm-svg" viewBox="0 0 880 560" role="group" aria-label="Grounds plan">' +
      '<defs>' +
        '<pattern id="vmGrass" width="26" height="26" patternUnits="userSpaceOnUse">' +
          '<rect width="26" height="26" fill="var(--vm-grass)"/>' +
          '<circle cx="6" cy="6" r="1.1" fill="var(--vm-grass-dot)"/>' +
          '<circle cx="19" cy="17" r="1.1" fill="var(--vm-grass-dot)"/>' +
        '</pattern>' +
      '</defs>' +

      '<rect x="8" y="8" width="864" height="544" rx="20" fill="url(#vmGrass)" stroke="var(--vm-edge)"/>' +

      /* the church building — decorative, not a zone */
      '<g aria-hidden="true" fill="var(--vm-build)" stroke="var(--vm-build-edge)">' +
        '<rect x="360" y="34" width="160" height="96" rx="6"/>' +
        '<path d="M440 8l26 26h-52z"/>' +
        '<rect x="432" y="52" width="16" height="30" fill="var(--vm-build-edge)"/>' +
      '</g>' +
      '<text x="440" y="150" class="vm-note" text-anchor="middle">Ascension Church</text>' +

      /* paths */
      '<path d="M440 470V300M180 300H700M440 300V150" stroke="var(--vm-path)" stroke-width="26" fill="none" stroke-linecap="round"/>' +

      zoneRect("gate",     360, 474, 160, 66,  "Entry &amp; Tokens") +
      zoneRect("grounds",  300, 196, 280, 150, "Church Grounds") +
      zoneRect("food",     628, 210, 200, 120, "Food Street") +
      zoneRect("stalls-a", 52,  210, 150, 120, "Stall Row A") +
      zoneRect("stalls-b", 52,  350, 150, 120, "Stall Row B") +
      zoneRect("kids",     628, 350, 200, 120, "Kids&#39; Corner") +
      zoneRect("basement", 236, 366, 150, 104, "Basement") +
      zoneRect("av",       410, 366, 150, 104, "AV Room") +
    '</svg>';
  }
  function zoneRect(id, x, y, w, h, label) {
    return '<g class="vm-zone" data-zone="' + id + '" tabindex="0" role="button" aria-label="' + label + '">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle">' + label + '</text>' +
    '</g>';
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
    function select(id) {
      var z = byId[id];
      if (!z) return;
      ctx.$$(".vm-zone", planBox).forEach(function (g) {
        g.classList.toggle("is-active", g.getAttribute("data-zone") === id);
      });
      if (legend) ctx.$$(".vm-chip", legend).forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-zone") === id);
      });

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
