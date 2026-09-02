/* ============================================================
   STAGE — the live lucky-draw picker
   Admin logs in (username + desk key, role must be admin) → the
   ticket pool loads → "Draw" spins to a random winner → "Confirm"
   records + emails them → "Next prize" reloads the pool.
   ============================================================ */
(function () {
  "use strict";
  var Y = window.VIM_YEAR || (window.VIM_YEARS && window.VIM_YEARS["2026"]) || {};
  var API = Y.api || "";
  var PRIZES = (Y.luckyDraw && Y.luckyDraw.prizes) || [];

  var $ = function (s) { return document.querySelector(s); };
  var SS = window.sessionStorage, KEY = "vim-stage";
  var token = "";
  try { token = JSON.parse(SS.getItem(KEY) || "{}").token || ""; } catch (e) {}

  function call(params) {
    var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(API + "?" + q, { cache: "no-store" }).then(function (r) {
      return r.text().then(function (t) {
        try { return JSON.parse(t); }
        catch (e) { throw new Error("unexpected response (" + r.status + ") — check the page URL / server folder"); }
      });
    });
  }

  /* ---------- gate ---------- */
  var gate = $("[data-gate]"), app = $("[data-app]");
  if (token) verifyAndStart(); else showGate();

  function showGate() { gate.hidden = false; app.hidden = true; }
  var skReveal = $("[data-sk-reveal]");
  if (skReveal) skReveal.addEventListener("click", function () {
    var i = $("#sk");
    i.type = i.type === "password" ? "text" : "password";
    skReveal.textContent = i.type === "password" ? "show" : "hide";
  });
  $("[data-gate-go]").addEventListener("click", function () {
    var u = $("#su").value.trim(), k = $("#sk").value.trim(), msg = $("[data-msg]");
    if (!API) { msg.textContent = "Config didn’t load — open this page through the site URL, not the file directly."; return; }
    if (!u || !k) { msg.textContent = "Enter both fields."; return; }
    msg.textContent = "Checking…";
    call({ action: "staffLogin", user: u, k: k }).then(function (res) {
      if (!res || !res.ok) { msg.textContent = (res && res.error) || "Not recognised."; return; }
      if (res.role !== "admin") { msg.textContent = "This screen is admin-only."; return; }
      token = res.token;
      try { SS.setItem(KEY, JSON.stringify({ token: token })); } catch (e) {}
      start();
    }).catch(function (err) { msg.textContent = (err && err.message) || "Can’t reach the server."; });
  });

  function verifyAndStart() {
    call({ action: "drawPool", token: token }).then(function (res) {
      if (res && res.pool) start(res); else { SS.removeItem(KEY); token = ""; showGate(); }
    }).catch(showGate);
  }

  /* ---------- app ---------- */
  var reel = $("[data-reel]"), caption = $("[data-caption]"), winnerEl = $("[data-winner]");
  var drawBtn = $("[data-draw]"), confirmBtn = $("[data-confirm]"), nextBtn = $("[data-next]");
  var prizeSel = $("[data-prize-select]"), prizeCustom = $("[data-prize-custom]"), countEl = $("[data-count]");
  var pool = [], chosen = null;

  function start(preloaded) {
    gate.hidden = true; app.hidden = false;
    $("[data-msg]").textContent = "";
    drawBtn.disabled = true;
    prizeSel.innerHTML = PRIZES.map(function (p) { return '<option>' + esc(p.place) + '</option>'; }).join("") +
      '<option value="__custom">Custom…</option>';
    prizeSel.addEventListener("change", function () {
      prizeCustom.hidden = prizeSel.value !== "__custom";
      if (!prizeCustom.hidden) prizeCustom.focus();
    });
    if (preloaded) setPool(preloaded); else loadPool();
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function prizeLabel() { return prizeSel.value === "__custom" ? (prizeCustom.value.trim() || "Prize") : prizeSel.value; }

  function loadPool() {
    reel.textContent = "…"; caption.textContent = "loading tickets…";
    drawBtn.disabled = true;
    call({ action: "drawPool", token: token }).then(function (res) {
      if (res && res.error) { caption.textContent = res.error; return; }
      setPool(res);
    }).catch(function (err) { caption.textContent = (err && err.message) || "couldn’t load the pool"; });
  }
  function setPool(res) {
    pool = (res && res.pool) || [];
    chosen = null;
    winnerEl.hidden = true; confirmBtn.hidden = true; nextBtn.hidden = true;
    drawBtn.hidden = false; drawBtn.disabled = pool.length === 0;
    countEl.textContent = pool.length + (pool.length === 1 ? " ticket in the hat" : " tickets in the hat");
    reel.textContent = pool.length ? "—" : "no tickets yet";
    caption.textContent = pool.length ? "ready to draw" : "";
    reel.classList.remove("is-spinning");
  }

  function last4(id) { var m = String(id).match(/(\d+)\s*$/); return m ? m[1] : String(id); }

  drawBtn.addEventListener("click", function () {
    if (!pool.length) return;
    drawBtn.disabled = true;
    chosen = pool[Math.floor(Math.random() * pool.length)];
    caption.textContent = "drawing " + prizeLabel() + "…";
    reel.classList.add("is-spinning");

    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var t0 = performance.now(), DUR = reduce ? 250 : 2800, lastTick = 0, landed = false;
    function frame(now) {
      if (landed) return;
      var p = Math.min(1, (now - t0) / DUR);
      var ease = 1 - Math.pow(1 - p, 3);
      var gap = 40 + ease * 260;                 // slows down
      if (now - lastTick >= gap) {
        reel.textContent = last4(pool[Math.floor(Math.random() * pool.length)].id);
        lastTick = now;
      }
      if (p < 1) requestAnimationFrame(frame);
      else land();
    }
    requestAnimationFrame(frame);
    setTimeout(land, DUR + 600);                 // safety — land even if rAF is paused (tab hidden)

    function land() {
      if (landed) return;
      landed = true;
      _land();
    }
  });

  function _land() {
    reel.classList.remove("is-spinning");
    reel.textContent = last4(chosen.id);
    caption.textContent = chosen.id;
    winnerEl.textContent = chosen.name ? chosen.name + " — is that you?" : "";
    winnerEl.hidden = !chosen.name;
    confirmBtn.hidden = false;
    nextBtn.hidden = false;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) confetti();
  }

  confirmBtn.addEventListener("click", function () {
    if (!chosen) return;
    confirmBtn.disabled = true; confirmBtn.textContent = "Recording…";
    call({ action: "drawRecordWinner", token: token, id: chosen.id, prize: prizeLabel() })
      .then(function (res) {
        confirmBtn.disabled = false; confirmBtn.textContent = "Confirm winner";
        if (res && res.ok) {
          caption.textContent = "✓ " + prizeLabel() + " — " + chosen.id + (res.name ? " (" + res.name + ")" : "");
          confirmBtn.hidden = true;
          // advance the prize selector to the next unused option
          if (prizeSel.selectedIndex < PRIZES.length - 1) prizeSel.selectedIndex++;
        } else alert((res && res.error) || "Could not record — try again.");
      })
      .catch(function () { confirmBtn.disabled = false; confirmBtn.textContent = "Confirm winner"; alert("Network problem."); });
  });

  nextBtn.addEventListener("click", loadPool);

  /* ---------- confetti ---------- */
  function confetti() {
    var cv = $("[data-confetti]"); if (!cv) return;
    var ctx = cv.getContext("2d");
    var w = cv.width = cv.clientWidth, h = cv.height = cv.clientHeight;
    var cols = ["#f2b84e", "#f27e97", "#3fd9c6", "#b7a6f6", "#ffffff"];
    var bits = [];
    for (var i = 0; i < 140; i++) bits.push({
      x: w / 2, y: h * 0.4, vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 1) * 14 - 4,
      s: Math.random() * 7 + 4, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4
    });
    var t0 = performance.now();
    (function anim(now) {
      var life = now - t0;
      ctx.clearRect(0, 0, w, h);
      bits.forEach(function (b) {
        b.vy += 0.4; b.x += b.vx; b.y += b.vy; b.vx *= 0.99; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
        ctx.fillStyle = b.c; ctx.globalAlpha = Math.max(0, 1 - life / 2600);
        ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6);
        ctx.restore();
      });
      if (life < 2600) requestAnimationFrame(anim); else ctx.clearRect(0, 0, w, h);
    })(t0);
  }
})();
