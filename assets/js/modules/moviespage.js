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

  /* Original minimalist poster art — one symbol per film, drawn on a
     200×300 canvas, symbols kept inside x 14–186 / y 28–214 (the viewBox
     crops to that box; the type owns the bottom of the card). Classes:
     a = accent colour, c = cream, k = the poster's own dark (cut-outs),
     l / la = cream / accent line work. Pick one with screenings[].art. */
  var ART = {
    /* Brand New Day — a sun coming up behind a city skyline */
    sunrise:
      '<circle class="a" cx="100" cy="146" r="50"/>' +
      '<path class="k" d="M14 200V160h16v-18h12v26h10v-40h14v52h10v-30h12v16h10v-58h14v44h12v-22h12v34h10v-16h14v52z"/>' +
      '<path class="la" d="M24 200h152" opacity=".6"/>',
    /* Obsession — one eye that won't look away */
    eye:
      '<path class="la" d="M28 140Q100 66 172 140Q100 214 28 140Z"/>' +
      '<circle class="la" cx="100" cy="140" r="30"/>' +
      '<circle class="a" cx="100" cy="140" r="13"/>' +
      '<circle class="c" cx="107" cy="133" r="3.2"/>' +
      '<path class="la" d="M100 72v-14M58 86l-8-10M142 86l8-10" opacity=".55"/>',
    /* Sheep Detectives — a woolly sheep, its face under the lens */
    sheep:
      '<g class="c"><circle cx="104" cy="136" r="22"/><circle cx="126" cy="130" r="20"/><circle cx="142" cy="146" r="18"/>' +
      '<circle cx="120" cy="156" r="22"/><circle cx="96" cy="156" r="18"/></g>' +
      '<path class="l" d="M104 172v20M120 176v16M136 172v20" />' +
      '<ellipse class="k" cx="78" cy="146" rx="12" ry="15"/>' +
      '<circle class="la" cx="76" cy="144" r="25" stroke-width="4.5"/>' +
      '<path class="la" d="M58 162L38 186" stroke-width="7"/>',
    /* Fall 2: Deadpoint — an impossibly tall mast, one light at the top */
    tower:
      '<path class="l" d="M100 44V206M92 206L100 44L108 206" opacity=".9"/>' +
      '<path class="l" d="M94 178l12-18M94 150l12-18M95 122l10-16M96 96l8-14M97 72l6-12" opacity=".45"/>' +
      '<path class="l" d="M86 206h28" />' +
      '<circle class="a" cx="100" cy="40" r="5"/>' +
      '<circle class="la" cx="100" cy="40" r="12" opacity=".45"/>' +
      '<circle class="la" cx="100" cy="40" r="21" opacity=".2"/>',
    /* Zootopia 2 — long rabbit ears beside a fox's */
    ears:
      '<g class="c"><rect x="52" y="86" width="20" height="112" rx="10"/><rect x="80" y="74" width="20" height="124" rx="10"/></g>' +
      '<g class="k" opacity=".35"><rect x="57" y="98" width="10" height="84" rx="5"/><rect x="85" y="86" width="10" height="96" rx="5"/></g>' +
      '<path class="a" d="M112 198Q114 150 128 116Q146 150 150 198ZM146 198Q150 150 168 116Q180 150 182 198Z"/>' +
      '<path class="k" opacity=".3" d="M122 190Q124 160 129 138Q138 160 140 190ZM156 190Q160 160 167 138Q173 160 173 190Z"/>'
  };
  function artSvg(key) {
    return '<svg class="cine-poster__svg" viewBox="14 28 172 186" aria-hidden="true" focusable="false">' + ART[key] + '</svg>';
  }

  wall.innerHTML = films.map(function (f, i) {
    /* "Fall 2: Deadpoint" → big "Fall 2", small "Deadpoint" */
    var parts = String(f.title).split(/:\s*/);
    var main = parts[0], sub = parts.slice(1).join(": ");
    var bg = ART[f.art]
      ? '<div class="cine-poster__art cine-poster__art--sym" aria-hidden="true"></div>' + artSvg(f.art)
      : '<div class="cine-poster__art" aria-hidden="true"><i></i><i></i></div>';
    var face = f.poster
      ? '<img class="cine-poster__img" src="' + esc(f.poster) + '" alt="" loading="lazy" decoding="async">'
      : bg +
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
        '<div class="cine-vote" data-vote-for="' + esc(f.title) + '" hidden></div>' +
      '</div>' +
    '</li>';
  }).join("");

  /* ---------- the poll: vote for a favourite, then see the pulse ----------
     Backend: Apps Script pollVote / pollResults (apps-script/Code.gs).
     Results are only shown after you've voted. One vote per browser. */
  (function poll() {
    var api = ctx.year.api || "";
    var bar = ctx.$("[data-poll-bar]");
    var boxes = ctx.$$("[data-vote-for]", wall);
    if (!api || !boxes.length) return;

    var LS = window.localStorage, KEY = "vim-poll-" + (ctx.year.year || "");
    function get(k) { try { return LS.getItem(k); } catch (e) { return null; } }
    function put(k, v) { try { LS.setItem(k, v); } catch (e) {} }
    var voter = get("vim-voter");
    if (!voter) { voter = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); put("vim-voter", voter); }
    var mine = get(KEY);

    function jsonp(params) {
      return new Promise(function (resolve, reject) {
        var cb = "vimpoll_" + Math.random().toString(36).slice(2);
        var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
        var sc = document.createElement("script"), done = false;
        var t = setTimeout(function () { if (!done) { cleanup(); reject(new Error("timeout")); } }, 12000);
        function cleanup() { done = true; clearTimeout(t); delete window[cb]; sc.remove(); }
        window[cb] = function (res) { cleanup(); resolve(res); };
        sc.onerror = function () { cleanup(); reject(new Error("network")); };
        sc.src = api + (api.indexOf("?") === -1 ? "?" : "&") + q + "&callback=" + cb;
        document.head.appendChild(sc);
      });
    }

    function say(key, n) {
      if (!bar) return;
      bar.innerHTML = '<span class="cine-pollbar__dot" aria-hidden="true"></span>' + esc(ctx.t(key).replace("{n}", n == null ? "" : Number(n).toLocaleString("en-IN")));
      bar.hidden = false;
    }

    function showButtons() {
      boxes.forEach(function (b) {
        var film = b.getAttribute("data-vote-for");
        b.innerHTML = '<button type="button" class="cine-vote__btn">' +
          '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '<span>' + esc(ctx.t("movies.poll.vote")) + '</span></button>';
        b.hidden = false;
        b.querySelector("button").addEventListener("click", function () { vote(film, this); });
      });
      say("movies.poll.ask");
    }

    function showResults(res) {
      var counts = (res && res.counts) || {}, total = (res && res.total) || 0;
      var top = Math.max.apply(null, Object.keys(counts).map(function (k) { return counts[k]; }).concat([0]));
      boxes.forEach(function (b) {
        var film = b.getAttribute("data-vote-for"), n = counts[film] || 0;
        var pct = total ? Math.round(n / total * 100) : 0;
        var isMine = film === mine, lead = n && n === top;
        b.innerHTML =
          '<div class="cine-vote__res' + (isMine ? ' is-mine' : '') + (lead ? ' is-lead' : '') + '">' +
            '<div class="cine-vote__row"><b>' + pct + '%</b>' +
              (isMine ? '<span class="cine-vote__mine">✓ ' + esc(ctx.t("movies.poll.yours")) + '</span>' : '') + '</div>' +
            '<div class="cine-vote__track"><i style="--w:' + pct + '%"></i></div>' +
          '</div>';
        b.hidden = false;
        /* let the bars grow in */
        requestAnimationFrame(function () { var i = b.querySelector("i"); if (i) i.classList.add("is-in"); });
      });
      say(res && res.open === false ? "movies.poll.closed" : "movies.poll.thanks", total);
    }

    function vote(film, btn) {
      boxes.forEach(function (b) { var x = b.querySelector("button"); if (x) x.disabled = true; });
      btn.classList.add("is-sending");
      jsonp({ action: "pollVote", film: film, voter: voter })
        .then(function (res) {
          if (res && res.results && (res.ok || res.error === "pollClosed")) {
            if (res.ok) { mine = film; put(KEY, film); }
            showResults(res.results);
          } else { showButtons(); say("movies.poll.err"); }
        })
        .catch(function () { showButtons(); say("movies.poll.err"); });
    }

    /* already voted on this browser → straight to the pulse; otherwise the
       buttons, unless the poll has been closed */
    jsonp({ action: "pollResults" })
      .then(function (res) {
        if (!res || res.error) return;               // backend not updated yet — stay quiet
        if (mine || res.open === false) showResults(res); else showButtons();
      })
      .catch(function () {});
  })();

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
