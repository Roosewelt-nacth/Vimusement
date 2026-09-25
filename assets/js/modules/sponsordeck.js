/* ============================================================
   MODULE — sponsordeck
   A wordless glowing dot pinned top-right. Hover it (mouse) or tap
   it (touch) and this year's sponsor logos slide down beneath it,
   one after another — just the logos, no panel behind them.

   One shared "stage" shows the card/promo each sponsor sent:
     · desktop — it floats left of the logos and glides to whichever
       logo is hovered, with a light 3D tilt + shine under the cursor.
       Clicking a logo opens the sponsor's website.
     · phones  — tapping a logo raises the card as a sheet above the
       dock, with a clear "site ↗" button and a close ✕.
   Once per visit, shortly after load, the logos drop down and tuck
   back again — a teaser so people learn the dot does something.

   Data: years/<year>.config.js → sponsors[]. Empty list = no dot.
   ============================================================ */
Vim.register("sponsordeck", function (ctx) {
  var list = (ctx.year.sponsors || []).filter(function (s) { return s && s.logo; });
  if (!list.length) return;
  if (!ctx.$("[data-dock]")) return; // staff-only pages carry no public chrome

  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var nameOf = function (s) { return ctx.L(s.name) || ctx.t("sponsors.deck.sponsor"); };
  var isVideo = function (src) { return /\.(mp4|webm|mov)(\?|#|$)/i.test(src || ""); };
  var hostOf = function (u) { try { return new URL(u, location.href).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  var sheetMode = window.matchMedia("(hover:none), (max-width:640px)");   // phones/tablets: card as a sheet
  var reduced = ctx.reducedMotion;

  var root = document.createElement("div");
  root.className = "sdeck";
  root.innerHTML =
    '<button type="button" class="sdeck__spark" aria-expanded="false" aria-controls="sdeckList" aria-label="' + esc(ctx.t("sponsors.deck.label")) + '">' +
      '<span class="sdeck__dot" aria-hidden="true"></span>' +
    '</button>' +
    '<ul class="sdeck__list" id="sdeckList" style="--n:' + list.length + '" aria-label="' + esc(ctx.t("sponsors.deck.label")) + '">' +
      list.map(function (s, i) {
        var tag = s.url ? 'a href="' + esc(s.url) + '" target="_blank" rel="noopener"' : 'button type="button"';
        return '<li class="sdeck__item" style="--i:' + i + '">' +
          '<' + tag + ' class="sdeck__logo" aria-label="' + esc(nameOf(s)) + '">' +
            '<img src="' + esc(s.logo) + '" alt="" decoding="async">' +
          (s.url ? '</a>' : '</button>') +
        '</li>';
      }).join("") +
    '</ul>' +
    '<div class="sdeck__stage" aria-live="polite">' +
      '<div class="sdeck__tilt">' +
        '<div class="sdeck__face" data-face></div>' +
        '<span class="sdeck__shine" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="sdeck__bar">' +
        '<a class="sdeck__visit" data-visit target="_blank" rel="noopener" hidden></a>' +
        '<button type="button" class="sdeck__x" data-x aria-label="' + esc(ctx.t("sponsors.deck.close")) + '">&times;</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  var spark = root.querySelector(".sdeck__spark");
  var listEl = root.querySelector(".sdeck__list");
  var stage = root.querySelector(".sdeck__stage");
  var tilt = root.querySelector(".sdeck__tilt");
  var face = root.querySelector("[data-face]");
  var visit = root.querySelector("[data-visit]");
  var items = Array.prototype.slice.call(root.querySelectorAll(".sdeck__item"));
  var logos = items.map(function (li) { return li.querySelector(".sdeck__logo"); });
  var current = -1, closeTimer = null, lastPointer = "mouse";

  /* ---------- open / close the logo column ---------- */
  function open() {
    clearTimeout(closeTimer);
    root.classList.remove("is-teasing");
    root.classList.add("is-open");
    spark.setAttribute("aria-expanded", "true");
  }
  function close() {
    root.classList.remove("is-open");
    spark.setAttribute("aria-expanded", "false");
    show(-1);
  }
  function closeSoon() { clearTimeout(closeTimer); closeTimer = setTimeout(close, 360); }

  /* ---------- the stage: one card that moves between logos ---------- */
  function media(s) {
    var alt = esc(ctx.t("sponsors.deck.cardAlt").replace("{name}", nameOf(s)));
    if (!s.card) return '<div class="sdeck__soon"><img src="' + esc(s.logo) + '" alt=""><span>' + esc(ctx.t("sponsors.deck.cardSoon")) + '</span></div>';
    if (isVideo(s.card)) return '<video class="sdeck__media" src="' + esc(s.card) + '" muted loop playsinline autoplay aria-label="' + alt + '"></video>';
    return '<img class="sdeck__media" src="' + esc(s.card) + '" alt="' + alt + '">';
  }
  function place(i) {   // desktop: sit the card level with its logo
    var li = items[i];
    stage.style.setProperty("--y", (listEl.offsetTop + li.offsetTop - listEl.scrollTop) + "px");
  }
  function show(i) {
    if (i === current) return;
    current = i;
    items.forEach(function (li, j) { li.classList.toggle("is-active", j === i); });
    root.classList.toggle("has-active", i >= 0);
    if (i < 0) { stage.classList.remove("is-shown"); var v = face.querySelector("video"); if (v) v.pause(); return; }

    var s = list[i];
    face.innerHTML = s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" tabindex="-1">' + media(s) + '</a>' : media(s);
    if (s.url) {
      visit.href = s.url;
      visit.innerHTML = esc(hostOf(s.url)) + ' <span aria-hidden="true">↗</span>';
      visit.setAttribute("aria-label", ctx.t("sponsors.deck.visit") + ": " + hostOf(s.url));
      visit.hidden = false;
    } else visit.hidden = true;

    place(i);
    stage.classList.add("is-shown");
    face.classList.remove("is-swap"); void face.offsetWidth; face.classList.add("is-swap");
  }

  /* ---------- pointer bookkeeping ---------- */
  root.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType || "mouse"; });
  root.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") lastPointer = "key"; });

  /* mouse: hover opens; leaving the whole widget (dot, logos, card) closes */
  root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") open(); });
  root.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") closeSoon(); });

  spark.addEventListener("click", function () {
    if (root.classList.contains("is-open") && lastPointer !== "mouse") close();
    else open();
  });

  logos.forEach(function (logo, i) {
    logo.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") show(i); });
    logo.addEventListener("focus", function () { if (lastPointer !== "touch") show(i); });
    logo.addEventListener("click", function (e) {
      if (lastPointer === "touch" || sheetMode.matches) {
        /* touch: a tap raises the card (it has its own website button);
           tapping the logo of the card already showing opens the site */
        if (current !== i || !list[i].url) { e.preventDefault(); show(i); }
        return;
      }
      if (!list[i].url) show(i);   // mouse/keyboard with a link: let it open the website
    });
  });

  /* arrow keys walk the logos */
  listEl.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    var n = logos.length, at = Math.max(0, logos.indexOf(document.activeElement));
    logos[(at + (e.key === "ArrowDown" ? 1 : n - 1)) % n].focus();
  });
  listEl.addEventListener("scroll", function () { if (current >= 0) place(current); }, { passive: true });

  root.querySelector("[data-x]").addEventListener("click", function () { show(-1); });

  /* ---------- tilt + shine under the cursor (desktop only) ---------- */
  if (!reduced) {
    tilt.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = tilt.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tilt.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
      tilt.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
      tilt.style.setProperty("--sx", (x * 100).toFixed(1) + "%");
      tilt.style.setProperty("--sy", (y * 100).toFixed(1) + "%");
      tilt.classList.add("is-tilting");
    });
    tilt.addEventListener("pointerleave", function () {
      tilt.classList.remove("is-tilting");
      tilt.style.setProperty("--rx", "0deg"); tilt.style.setProperty("--ry", "0deg");
    });
  }

  /* tap outside or Escape closes */
  document.addEventListener("pointerdown", function (e) { if (!root.contains(e.target)) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !root.classList.contains("is-open")) return;
    if (current >= 0 && sheetMode.matches) { show(-1); return; }
    close(); spark.focus();
  });

  /* ---------- once-per-visit teaser: drop the logos, tuck them back ---------- */
  var TEASED = "vim-sdeck-teased", teased = true;
  try { teased = sessionStorage.getItem(TEASED) === "1"; } catch (e) {}
  if (!teased && !reduced) {
    setTimeout(function () {
      if (root.classList.contains("is-open")) return;
      try { sessionStorage.setItem(TEASED, "1"); } catch (e) {}
      root.classList.add("is-teasing");
      setTimeout(function () { root.classList.remove("is-teasing"); }, 1900);
    }, 3200);
  }
});
