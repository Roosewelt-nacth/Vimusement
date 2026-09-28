/* ============================================================
   MODULE — scratch  (draw.html)
   Each prize photo sits under a sheet of gold foil, like a scratch
   card. Scratch it with a finger or the mouse; once about half is
   gone the rest falls away. The prize name and worth stay readable
   beside it, so nothing is hidden from anyone who doesn't scratch.
   Keyboard: the foil is a button, Enter or Space reveals it.
   A scratched card stays revealed for 2 minutes; after that the foil
   is back the next time the page loads.
   Runs after luckypage.js has drawn the cards.
   ============================================================ */
Vim.register("scratch", function (ctx) {
  var box = ctx.$("[data-lucky-prizes]");
  if (!box) return;
  function tt(key, fallback) { var v = ctx.t(key); return v === key ? fallback : v; }
  var KEY = "vim.scratched", KEEP = 2 * 60 * 1000, done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  function fresh(id) { return done[id] && Date.now() - done[id] < KEEP; }
  function remember(id) { done[id] = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }

  function foil(fig, idx) {
    var img = fig.querySelector("img");
    var id = img ? img.getAttribute("src") : "p" + idx;
    if (fresh(id)) return;
    var c = document.createElement("canvas");
    c.className = "scratch"; c.tabIndex = 0;
    c.setAttribute("role", "button");
    c.setAttribute("aria-label", tt("scratch.aria", "Scratch to reveal the prize photo"));
    var sheen = document.createElement("span"); sheen.className = "scratch__sheen"; sheen.setAttribute("aria-hidden", "true");
    fig.appendChild(c); fig.appendChild(sheen);
    fig.classList.add("has-foil");
    var g = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
    var started = false, gone = false, last = null, moves = 0;

    function paint() {
      var r = fig.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      c.width = W * dpr; c.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalCompositeOperation = "source-over";
      var lg = g.createLinearGradient(0, 0, W, H);
      lg.addColorStop(0, "#A8792A"); lg.addColorStop(.3, "#E6C16A"); lg.addColorStop(.5, "#F6DE96");
      lg.addColorStop(.7, "#D3A447"); lg.addColorStop(1, "#9C6E24");
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
      // a fine brushed grain, so it reads as metal foil and not a flat colour
      for (var y = 0; y < H; y += 2) {
        g.fillStyle = "rgba(255,255,255," + (Math.random() * .07).toFixed(3) + ")"; g.fillRect(0, y, W, 1);
      }
      for (var k = 0; k < W * H / 90; k++) {
        g.fillStyle = Math.random() < .5 ? "rgba(90,60,10,.18)" : "rgba(255,245,210,.22)";
        g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }
      // the label, pressed into the foil
      var big = Math.max(15, Math.min(24, W / 16));
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "600 " + big + "px " + getComputedStyle(document.body).fontFamily;
      g.fillStyle = "rgba(255,248,225,.55)"; g.fillText(tt("scratch.label", "Scratch to reveal"), W / 2 + 1, H / 2 + 1);
      g.fillStyle = "rgba(92,62,14,.78)"; g.fillText(tt("scratch.label", "Scratch to reveal"), W / 2, H / 2);
      coin(W / 2, H / 2 - big * 1.9, big * .95);
    }
    function coin(x, y, r) {
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = "rgba(92,62,14,.18)"; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = "rgba(92,62,14,.55)"; g.stroke();
      g.fillStyle = "rgba(92,62,14,.75)"; g.font = "700 " + r + "px " + getComputedStyle(document.body).fontFamily;
      g.fillText("₹", x, y + r * .06);
    }
    function pt(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function scratch(a, b) {
      g.globalCompositeOperation = "destination-out";
      g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = Math.max(34, W / 11);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x + .01, b.y); g.stroke();
      if (!started) { started = true; sheen.remove(); fig.classList.add("is-scratching"); }
      if (++moves % 6 === 0) check();
    }
    function check() {                                          // how much foil is left, on a coarse grid
      var step = 12 * dpr, d = g.getImageData(0, 0, c.width, c.height).data, seen = 0, clear = 0;
      for (var y = step / 2; y < c.height; y += step) for (var x = step / 2; x < c.width; x += step) {
        seen++; if (d[((y | 0) * c.width + (x | 0)) * 4 + 3] < 40) clear++;
      }
      if (clear / seen > .48) reveal();
    }
    function reveal() {
      if (gone) return; gone = true; remember(id);
      c.classList.add("is-gone"); sheen.remove();
      fig.classList.remove("is-scratching"); fig.classList.add("is-revealed");
      setTimeout(function () { c.remove(); fig.classList.remove("has-foil"); }, 700);
    }

    c.addEventListener("pointerdown", function (e) {
      last = pt(e); scratch(last, last);
      try { c.setPointerCapture(e.pointerId); } catch (x) {}
    });
    c.addEventListener("pointermove", function (e) {
      if (!last) { if (e.pointerType === "mouse" && e.buttons === 0) return; last = pt(e); }
      if (e.pointerType === "mouse" && e.buttons === 0) { last = null; return; }
      var p = pt(e); scratch(last, p); last = p;
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
      c.addEventListener(ev, function () { last = null; if (started) check(); });
    });
    c.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); }
    });
    paint();
    var rt; addEventListener("resize", function () { if (gone || started) return; clearTimeout(rt); rt = setTimeout(paint, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!started && !gone) paint(); });
  }

  function init() {
    var figs = ctx.$$(".lucky-prize__photo", box);
    if (!figs.length) return false;
    figs.forEach(foil);
    return true;
  }
  if (!init()) {                                                  // cards not drawn yet: wait for them
    var mo = new MutationObserver(function () { if (init()) mo.disconnect(); });
    mo.observe(box, { childList: true });
  }
});
