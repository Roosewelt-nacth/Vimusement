/* ============================================================
   MODULE — victorian
   A small luminous angel who drifts around the *page* (not the
   screen — it scrolls with the content and wanders back into
   view). Drag it anywhere and it stays put there.
     · gentle bob + wing flap + a warm aura so it reads anywhere
     · one warm line the first time you visit
     · a friendly line on click (rotates, never nags)
     · tap five times fast -> confetti
   Dismiss with the × ; stays gone for the session.
   Off / static under prefers-reduced-motion.
   ============================================================ */
Vim.register("victorian", function (ctx) {
  if (document.querySelector(".vic")) return;
  var SEEN = "vic-hi", GONE = "vic-off", POS = "vic-pos";
  try { if (sessionStorage.getItem(GONE)) return; } catch (e) {}

  var reduce = ctx.reducedMotion;
  var W = 62, H = 62;
  var LINES = [
    "Every gift, big or small, counts the same.",
    "The lucky draw is called live on stage. Could be your number.",
    "Bring a friend on the day. It is more fun in a crowd.",
    "Thank you for being here. It matters more than you know.",
    "One day of fun, a whole year of good."
  ];
  var li = (Math.random() * LINES.length) | 0;

  var el = document.createElement("div");
  el.className = "vic";
  el.innerHTML =
    '<button type="button" class="vic__btn" aria-label="A hello from Victorian, your guide to the fair">' +
      '<svg class="vic__art" viewBox="0 0 64 64" aria-hidden="true">' +
        '<circle class="vic__glow" cx="32" cy="32" r="22"/>' +
        '<g class="vic__float">' +
          '<path class="vic__wing vic__wing--l" d="M28 32C15 25 6 30 4 41c9-2 14 2 18 9 2-10 4-16 6-18z"/>' +
          '<path class="vic__wing vic__wing--r" d="M36 32c13-7 22-2 24 9-9-2-14 2-18 9-2-10-4-16-6-18z"/>' +
          '<path class="vic__robe" d="M32 24c-7.5 0-12 6-13 24 8.5 3.2 17.5 3.2 26 0-1-18-5.5-24-13-24z"/>' +
          '<circle class="vic__head" cx="32" cy="19" r="7"/>' +
          '<ellipse class="vic__halo" cx="32" cy="9" rx="8.5" ry="2.6"/>' +
        '</g>' +
      '</svg>' +
    '</button>' +
    '<div class="vic__bubble" data-vic-bubble hidden aria-live="polite"></div>' +
    '<button type="button" class="vic__x" data-vic-close aria-label="Hide Victorian">' +
      '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>' +
    '</button>';
  document.body.appendChild(el);
  el.style.position = "absolute";

  var bubble = el.querySelector("[data-vic-bubble]");
  var btn = el.querySelector(".vic__btn");
  var roamOn = !reduce, roamT, held = false, drag = null;

  function docW() { return document.documentElement.clientWidth; }
  function band() {
    var y = window.scrollY;
    return { minY: y + 70, maxY: y + window.innerHeight - H - 90, maxX: Math.max(6, docW() - W - 10) };
  }
  function at() { return { x: parseFloat(el.style.left) || 0, y: parseFloat(el.style.top) || 0 }; }
  function place(x, y, secs) {
    var b = band();
    x = Math.max(6, Math.min(x, b.maxX));
    y = Math.max(window.scrollY + 4, Math.min(y, document.documentElement.scrollHeight - H - 4));
    el.style.transition = secs
      ? "left " + secs + "s cubic-bezier(.35,.08,.2,1), top " + secs + "s cubic-bezier(.35,.08,.2,1)"
      : "none";
    el.style.left = Math.round(x) + "px";
    el.style.top = Math.round(y) + "px";
    el.classList.toggle("vic--left", x < window.innerWidth * 0.4);
  }

  /* initial spot: where the user last dropped it, else lower-right of the first screen */
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(POS) || "null"); } catch (e) {}
  if (saved && typeof saved.x === "number") {
    place(saved.x, saved.y, 0);
    roamOn = false;                 // stay where they put it
  } else {
    place(docW() - W - 20, window.scrollY + window.innerHeight - H - 120, 0);
  }

  var bubbleTimer;
  function say(text, ms) {
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.hidden = false;
    el.classList.add("is-talking");
    held = true;
    bubbleTimer = setTimeout(function () {
      bubble.hidden = true;
      el.classList.remove("is-talking");
      held = false;
    }, ms || 6000);
  }

  /* ---- roaming ---------------------------------------------- */
  function wander() {
    clearTimeout(roamT);
    if (!roamOn || held || drag || document.hidden) { roamT = setTimeout(wander, 4000); return; }
    var b = band();
    var home = Math.random() < 0.2;
    var tx = home ? docW() - W - 20 : 6 + Math.random() * b.maxX;
    var ty = home ? window.scrollY + window.innerHeight - H - 120
                  : b.minY + Math.random() * Math.max(40, b.maxY - b.minY);
    var here = at();
    var secs = Math.max(3, Math.min(9, Math.hypot(tx - here.x, ty - here.y) / 95));
    place(tx, ty, secs);
    roamT = setTimeout(wander, secs * 1000 + 4000 + Math.random() * 9000);
  }
  if (roamOn) roamT = setTimeout(wander, 4500);

  /* if it scrolls out of view for a bit, bring it back sooner */
  var scrollT;
  addEventListener("scroll", function () {
    if (!roamOn || held || drag) return;
    clearTimeout(scrollT);
    scrollT = setTimeout(function () {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { clearTimeout(roamT); roamT = setTimeout(wander, 1200); }
    }, 700);
  }, { passive: true });

  /* ---- drag to place ------------------------------------------ */
  btn.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button > 0) return;
    var p = at();
    drag = { sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: false };
    try { btn.setPointerCapture(e.pointerId); } catch (x) {}
    held = true;
    el.classList.add("is-dragging");
    el.style.transition = "none";
  });
  btn.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    var x = Math.max(4, Math.min(drag.ox + dx, docW() - W - 4));
    var y = Math.max(window.scrollY + 4, drag.oy + dy);
    el.style.left = Math.round(x) + "px";
    el.style.top = Math.round(y) + "px";
    el.classList.toggle("vic--left", x < window.innerWidth * 0.4);
  });
  btn.addEventListener("pointerup", function (e) {
    if (!drag) return;
    var moved = drag.moved;
    drag = null;
    el.classList.remove("is-dragging");
    try { btn.releasePointerCapture(e.pointerId); } catch (x) {}
    if (moved) {
      clearTimeout(roamT);
      roamOn = false;
      held = false;
      try { localStorage.setItem(POS, JSON.stringify({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) })); } catch (x) {}
      say("Right here it is, then.", 3000);
    } else {
      held = false;
      tap();
    }
  });
  btn.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); }
  });

  /* ---- click behaviour --------------------------------------- */
  var taps = 0, tapTimer;
  function tap() {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function () { taps = 0; }, 1200);
    if (taps >= 5) { taps = 0; say("You found me. Have some confetti.", 4000); confetti(); return; }
    say(LINES[li % LINES.length], 5500);
    li++;
  }

  /* first hello */
  try {
    if (!sessionStorage.getItem(SEEN)) {
      setTimeout(function () { say("Welcome. So glad you stopped by.", 6500); }, 1600);
      sessionStorage.setItem(SEEN, "1");
    }
  } catch (e) {}

  el.querySelector("[data-vic-close]").addEventListener("click", function () {
    clearTimeout(roamT);
    roamOn = false;
    el.style.transition = "opacity .35s, transform .35s";
    el.style.transform = "translateY(10px) scale(.9)";
    el.style.opacity = "0";
    try { sessionStorage.setItem(GONE, "1"); localStorage.removeItem(POS); } catch (e) {}
    setTimeout(function () { el.remove(); }, 420);
  });

  el.addEventListener("mouseenter", function () { if (!drag) held = true; });
  el.addEventListener("mouseleave", function () {
    if (!drag && bubble.hidden) held = false;   // keep holding while a line is on screen
  });
  document.addEventListener("visibilitychange", function () {
    el.classList.toggle("is-paused", document.hidden);
    if (!document.hidden && roamOn) { clearTimeout(roamT); roamT = setTimeout(wander, 1500); }
  });

  /* ---- confetti burst -------------------------------------- */
  function confetti() {
    if (reduce) return;
    var cv = document.createElement("canvas");
    cv.className = "vic__confetti";
    document.body.appendChild(cv);
    var g = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = el.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    var COLS = ["#E7B85C", "#D6335A", "#C2213A", "#F6EDE1", "#9B2F4A"];
    var bits = [];
    for (var i = 0; i < 46; i++) {
      var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7;
      bits.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
        s: 4 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
        c: COLS[(Math.random() * COLS.length) | 0], life: 1 });
    }
    var t0 = performance.now();
    (function frame(now) {
      var dt = Math.min(32, now - t0); t0 = now;
      g.clearRect(0, 0, innerWidth, innerHeight);
      var alive = false;
      bits.forEach(function (b) {
        b.vy += 0.22 * (dt / 16); b.x += b.vx * (dt / 16); b.y += b.vy * (dt / 16);
        b.rot += b.vr; b.life -= 0.012 * (dt / 16);
        if (b.life <= 0) return;
        alive = true;
        g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.globalAlpha = Math.max(0, b.life);
        g.fillStyle = b.c; g.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6); g.restore();
      });
      if (alive) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }
});
