/* ============================================================
   MODULE — candles  (candles.html)
   Light a star: name (optional) + a dedication/intention +
   an optional short message. Joins a public, paginated, scrollable
   sky — a big scrollable/zoomable canvas, not a fixed grid, so
   finding your own star means exploring the sky a little.

   Data: {api}?action=lightCandle  (POST-ish GET, JSONP)
         {api}?action=candles&offset=&limit=  ->  { candles:[{name,dedication,message,ts}], count, hasMore }

   Markup:
     [data-candle-name] [data-candle-dedication] [data-candle-message]
     [data-candle-go] [data-candle-status]
     [data-star-viewport] [data-candle-wall] [data-candle-more]
     [data-star-zoom-out] [data-star-zoom-in] [data-star-zoom-reset]
   ============================================================ */
Vim.register("candles", function (ctx) {
  var wall = ctx.$("[data-candle-wall]");
  if (!wall) return;

  var api = ctx.year.api || "";
  var year = (ctx.year && ctx.year.year) || new Date().getFullYear();

  var nameEl = ctx.$("[data-candle-name]");
  var dedEl = ctx.$("[data-candle-dedication]");
  var msgEl = ctx.$("[data-candle-message]");
  var go = ctx.$("[data-candle-go]");
  var status = ctx.$("[data-candle-status]");
  var moreBtn = ctx.$("[data-candle-more]");
  var viewport = ctx.$("[data-star-viewport]");
  var zoomOutBtn = ctx.$("[data-star-zoom-out]");
  var zoomInBtn = ctx.$("[data-star-zoom-in]");
  var zoomResetBtn = ctx.$("[data-star-zoom-reset]");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function say(m, k) { if (status) { status.innerHTML = m || ""; status.dataset.kind = k || ""; status.hidden = !m; } }

  /* JSONP — Apps Script redirects /exec off-origin; fetch() is CORS-blocked from GitHub Pages. */
  function jsonp(params) {
    return new Promise(function (resolve, reject) {
      var cb = "vimcb_" + Math.random().toString(36).slice(2);
      var q = Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }).join("&");
      var sc = document.createElement("script");
      var t = setTimeout(function () { done(); reject(new Error("timeout")); }, 20000);
      function done() { clearTimeout(t); try { delete window[cb]; } catch (e) { window[cb] = undefined; } sc.remove(); }
      window[cb] = function (data) { done(); resolve(data); };
      sc.onerror = function () { done(); reject(new Error("network")); };
      sc.src = api + (api.indexOf("?") > -1 ? "&" : "?") + q + "&callback=" + cb;
      document.head.appendChild(sc);
    });
  }

  /* soft client-side cooldown — not spoof-proof, just stops accidental double-taps */
  var GATE_KEY = "vim-candle-last-" + year;
  var GATE_MS = 60000;
  function recentlyLit() {
    try { return Date.now() - (parseInt(localStorage.getItem(GATE_KEY), 10) || 0) < GATE_MS; }
    catch (e) { return false; }
  }
  function markLit() { try { localStorage.setItem(GATE_KEY, String(Date.now())); } catch (e) {} }

  /* a few star glyphs — sparkle, classic 5-point, plus-twinkle, simple dot —
     picked per-star so the sky isn't one shape repeated */
  var STAR_SHAPES = [
    '<path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z"/>',                      // sparkle
    '<path d="M12 2l2.5 7h7.5l-6 4.6 2.3 7.4-6-4.4-6 4.4 2.3-7.4-6-4.6h7.5Z"/>',         // classic 5-point
    '<path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>', // twinkle cross
    '<circle cx="12" cy="12" r="4.5"/>'                                                  // simple dot
  ];

  /* seeded per-star "randomness" (shape, size, sky position) so a given
     star sits in the same spot with the same look on every reload, but
     the sky as a whole still reads as scattered, not gridded or repeated */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }

  /* stratified placement: divide the sky into cells sized off the total
     star count (so a sky of 3 doesn't crowd into one corner, and a sky
     of 300 doesn't overlap), then jitter within the cell using a hash of
     the star's own text — even spread, still looks organic, not gridded */
  var MIN_CELLS = 24;
  function starPos(i, total) {
    var n = Math.max(total, MIN_CELLS);
    var cols = Math.max(5, Math.ceil(Math.sqrt(n * 1.7)));
    var rows = Math.max(4, Math.ceil(n / cols));
    var col = i % cols, row = ((i / cols) | 0) % rows;
    var cellW = 100 / cols, cellH = 100 / rows;
    var hh = hash("pos" + i + "x" + total);
    var jx = ((hh % 1000) / 1000 - 0.5) * cellW * 0.85;
    var jy = (((hh / 1000 | 0) % 1000) / 1000 - 0.5) * cellH * 0.85;
    var x = col * cellW + cellW / 2 + jx;
    var y = row * cellH + cellH / 2 + jy;
    return { x: Math.min(97, Math.max(3, x)), y: Math.min(94, Math.max(4, y)) };
  }

  function cardHTML(c, i, total) {
    var who = c.name ? esc(c.name) : "lit anonymously";
    var pos = starPos(i, total);
    var h = hash((c.dedication || "") + "|" + (c.name || "") + "|" + i);
    var scale = (0.65 + (h % 100) / 100 * 0.85).toFixed(2);
    var shape = STAR_SHAPES[h % STAR_SHAPES.length];
    var edge = pos.x < 14 ? " star--edge-l" : pos.x > 86 ? " star--edge-r" : "";
    if (pos.y < 16) edge += " star--edge-t";
    /* visible to everyone: just a point of light. The dedication (and who
       lit it) only ever shows in the tip on hover/focus — but it's on the
       aria-label from the start, so a keyboard/screen-reader visitor isn't
       the one person who never gets to "read" a star. */
    var label = c.dedication + " — " + who + (c.message ? ". " + c.message : "");
    return (
      '<li class="star' + edge + '" data-star-idx="' + i + '" tabindex="0" role="group" aria-label="' + esc(label) + '" ' +
        'style="--x:' + pos.x.toFixed(1) + '%;--y:' + pos.y.toFixed(1) + '%;--s:' + scale + ';--i:' + (i % 7) + '">' +
        '<svg class="star__glyph" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + shape + '</svg>' +
        '<span class="star__tip" aria-hidden="true">' +
          '<strong>' + esc(c.dedication) + "</strong>" +
          '<em>— ' + who + "</em>" +
          (c.message ? "<p>" + esc(c.message) + "</p>" : "") +
        "</span>" +
      "</li>"
    );
  }

  var glow = ctx.$("[data-candle-glow]");

  /* the sky is a big canvas, not a fixed grid — it grows with the number
     of stars, and zoom just scales that canvas (stars are positioned in
     %, so resizing the canvas alone redistributes them correctly). Finding
     any one star means scrolling/dragging around, or zooming out. */
  var ZOOM = 1, BASE_W = 900, BASE_H = 480;
  function sizeField(total) {
    var vw = (viewport && viewport.clientWidth) || 600;
    BASE_W = Math.max(vw * 1.7, 760 + total * 42);
    BASE_H = Math.max(vw * 0.85, 460 + total * 20);
    paintFieldSize();
  }
  function paintFieldSize() {
    wall.style.width = Math.round(BASE_W * ZOOM) + "px";
    wall.style.height = Math.round(BASE_H * ZOOM) + "px";
  }
  function centerViewport() {
    if (!viewport) return;
    viewport.scrollLeft = Math.max(0, (wall.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (wall.scrollHeight - viewport.clientHeight) / 2);
  }
  function zoomBy(delta) {
    ZOOM = Math.max(0.55, Math.min(2.4, +(ZOOM + delta).toFixed(2)));
    paintFieldSize();
  }
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", function () { zoomBy(-0.25); });
  if (zoomInBtn) zoomInBtn.addEventListener("click", function () { zoomBy(0.25); });
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", function () {
    ZOOM = 1; paintFieldSize(); centerViewport();
  });

  var OFFSET = 0, LIMIT = 18, LOADING = false;

  function load(reset) {
    if (LOADING || !api) return;
    LOADING = true;
    if (reset) { OFFSET = 0; wall.innerHTML = '<li class="candle-wall__loading">Charting the sky…</li>'; }
    jsonp({ action: "candles", offset: OFFSET, limit: LIMIT })
      .then(function (data) {
        LOADING = false;
        var items = (data && data.candles) || [];
        var total = (data && data.count) || items.length;
        if (reset) wall.innerHTML = "";
        if (reset && !items.length) {
          wall.innerHTML = '<li class="candle-wall__empty">Be the first to light a star.</li>';
        } else {
          var startAt = OFFSET;
          wall.insertAdjacentHTML("beforeend", items.map(function (c, idx) {
            return cardHTML(c, startAt + idx, total);
          }).join(""));
          sizeField(total);
          if (reset) centerViewport();
        }
        OFFSET += items.length;
        if (moreBtn) moreBtn.hidden = !(data && data.hasMore);
        if (glow) glow.style.opacity = String(Math.min(1, 0.12 + total * 0.025));
      })
      .catch(function () {
        LOADING = false;
        if (reset) wall.innerHTML = '<li class="candle-wall__empty">Couldn’t load the sky just now. Reload to try again.</li>';
      });
  }

  if (moreBtn) moreBtn.addEventListener("click", function () { load(false); });

  function shareLink(dedication) {
    var text = "I lit a star for “" + dedication + "” on the Vimusement night sky — light one too:";
    var url = location.href.split("#")[0];
    return "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
  }

  /* after lighting, scroll/zoom to reveal exactly where the new star landed —
     the one time we do the finding for you, since everyone else still has
     to explore the sky to spot it */
  function revealJustLit() {
    var star = wall.querySelector('[data-star-idx="0"]');
    if (!star || !viewport) return;
    var x = parseFloat(star.style.getPropertyValue("--x")) / 100;
    var y = parseFloat(star.style.getPropertyValue("--y")) / 100;
    viewport.scrollLeft = Math.max(0, x * wall.scrollWidth - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, y * wall.scrollHeight - viewport.clientHeight / 2);
    star.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }

  function submit() {
    if (!api) { say("Star lighting isn’t switched on yet. Please check back soon.", "warn"); return; }
    var name = ((nameEl && nameEl.value) || "").trim();
    var dedication = ((dedEl && dedEl.value) || "").trim();
    var message = ((msgEl && msgEl.value) || "").trim();
    if (!dedication) { say("Please add a short dedication or intention.", "warn"); dedEl && dedEl.focus(); return; }
    if (recentlyLit()) { say("You just lit one — thank you. Give it a moment before lighting another.", "warn"); return; }

    go.disabled = true; say("Lighting your star…");
    jsonp({ action: "lightCandle", name: name, dedication: dedication, message: message })
      .then(function (res) {
        go.disabled = false;
        if (res && res.error) { say(res.error, "warn"); return; }
        markLit();
        if (nameEl) nameEl.value = "";
        if (dedEl) dedEl.value = "";
        if (msgEl) msgEl.value = "";
        say(
          "Your star is lit, and stays remembered here — a small point of light, for good. " +
          '<a href="' + shareLink(dedication) + '" target="_blank" rel="noopener">Share on WhatsApp</a>',
          "ok"
        );
        load(true);
        setTimeout(revealJustLit, 300);
      })
      .catch(function () { go.disabled = false; say("Network problem. Please try again.", "warn"); });
  }

  if (go) go.addEventListener("click", function (e) { e.preventDefault(); submit(); });

  if (!api) {
    wall.innerHTML = '<li class="candle-wall__empty">The sky opens once this feature is switched on.</li>';
  } else {
    load(true);
  }
});
