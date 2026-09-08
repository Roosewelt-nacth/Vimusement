/* ============================================================
   MODULE — candles  (candles.html)
   Light a candle: name (optional) + a dedication/intention +
   an optional short message. Joins a public, paginated wall.

   Data: {api}?action=lightCandle  (POST-ish GET, JSONP)
         {api}?action=candles&offset=&limit=  ->  { candles:[{name,dedication,message,ts}], count, hasMore }

   Markup:
     [data-candle-name] [data-candle-dedication] [data-candle-message]
     [data-candle-go] [data-candle-status]
     [data-candle-wall] [data-candle-more]
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

  var FLAME =
    '<svg class="candle__flame-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1-.5-2-.5-2 1.5 1 2.5 3 2.5 5a4.5 4.5 0 0 1-9 0c0-3.5 2.5-5.5 3-8 .5-1 1.5-1.8 2-2Z"/></svg>';

  /* a little variety per candle (height, wax tone) so the stand doesn't
     look like repeated clip-art — seeded off the text, not random, so a
     given candle looks the same on every reload */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }
  var WAX = ["#F3E4C8", "#F6D9C4", "#F0E6D2", "#E9CFC0", "#F5E1D6"];

  function cardHTML(c, i) {
    var who = c.name ? esc(c.name) : "lit anonymously";
    var h = hash((c.dedication || "") + "|" + (c.name || "") + "|" + i);
    var height = 54 + (h % 32);
    var wax = WAX[h % WAX.length];
    /* visible to everyone: just the flame + wax. The dedication only ever
       shows in the tip on hover/focus — but it's on the aria-label from the
       start, so a keyboard/screen-reader visitor isn't the one person who
       never gets to "read" a candle. */
    var label = c.dedication + " — " + who + (c.message ? ". " + c.message : "");
    return (
      '<li class="candle" tabindex="0" role="group" aria-label="' + esc(label) + '" ' +
        'style="--h:' + height + 'px;--wax:' + wax + ';--i:' + (i % 7) + '">' +
        '<span class="candle__flame">' + FLAME + "</span>" +
        '<span class="candle__body"></span>' +
        '<span class="candle__tip" aria-hidden="true">' +
          '<strong>' + esc(c.dedication) + "</strong>" +
          '<em>— ' + who + "</em>" +
          (c.message ? "<p>" + esc(c.message) + "</p>" : "") +
        "</span>" +
      "</li>"
    );
  }

  var OFFSET = 0, LIMIT = 12, LOADING = false;

  function load(reset) {
    if (LOADING || !api) return;
    LOADING = true;
    if (reset) { OFFSET = 0; wall.innerHTML = '<li class="candle-wall__loading">Loading candles…</li>'; }
    jsonp({ action: "candles", offset: OFFSET, limit: LIMIT })
      .then(function (data) {
        LOADING = false;
        var items = (data && data.candles) || [];
        if (reset) wall.innerHTML = "";
        if (reset && !items.length) {
          wall.innerHTML = '<li class="candle-wall__empty">Be the first to light a candle.</li>';
        } else {
          wall.insertAdjacentHTML("beforeend", items.map(cardHTML).join(""));
        }
        OFFSET += items.length;
        if (moreBtn) moreBtn.hidden = !(data && data.hasMore);
      })
      .catch(function () {
        LOADING = false;
        if (reset) wall.innerHTML = '<li class="candle-wall__empty">Couldn’t load the wall just now. Reload to try again.</li>';
      });
  }

  if (moreBtn) moreBtn.addEventListener("click", function () { load(false); });

  function shareLink(dedication) {
    var text = "I lit a candle for “" + dedication + "” on the Vimusement candle wall — light one too:";
    var url = location.href.split("#")[0];
    return "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
  }

  function submit() {
    if (!api) { say("Candle lighting isn’t switched on yet. Please check back soon.", "warn"); return; }
    var name = ((nameEl && nameEl.value) || "").trim();
    var dedication = ((dedEl && dedEl.value) || "").trim();
    var message = ((msgEl && msgEl.value) || "").trim();
    if (!dedication) { say("Please add a short dedication or intention.", "warn"); dedEl && dedEl.focus(); return; }
    if (recentlyLit()) { say("You just lit one — thank you. Give it a moment before lighting another.", "warn"); return; }

    go.disabled = true; say("Lighting your candle…");
    jsonp({ action: "lightCandle", name: name, dedication: dedication, message: message })
      .then(function (res) {
        go.disabled = false;
        if (res && res.error) { say(res.error, "warn"); return; }
        markLit();
        if (nameEl) nameEl.value = "";
        if (dedEl) dedEl.value = "";
        if (msgEl) msgEl.value = "";
        say(
          "Your candle is lit, and your intention will be read aloud at the 8:30 AM Mass on the day of the fair. " +
          '<a href="' + shareLink(dedication) + '" target="_blank" rel="noopener">Share on WhatsApp</a>',
          "ok"
        );
        load(true);
      })
      .catch(function () { go.disabled = false; say("Network problem. Please try again.", "warn"); });
  }

  if (go) go.addEventListener("click", function (e) { e.preventDefault(); submit(); });

  if (!api) {
    wall.innerHTML = '<li class="candle-wall__empty">The candle stand opens once this feature is switched on.</li>';
  } else {
    load(true);
  }
});
