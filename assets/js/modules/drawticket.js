/* ============================================================
   MODULE — drawticket  (draw.html)
   A live preview of the lucky-draw ticket. Fills in as the buyer
   types their name and changes quantity; the generative pattern
   is seeded off the name, so everyone's ticket looks a little
   different. The real number is assigned server-side on payment,
   so the stub shows "····" + "Provisional" until then.

   Markup:  <div data-ticket-preview></div>  in the ticket panel,
            alongside [data-draw-name] and [data-draw-qty].
   ============================================================ */
Vim.register("drawticket", function (ctx) {
  var host = ctx.$("[data-ticket-preview]");
  if (!host) return;

  var nameEl = ctx.$("[data-draw-name]");
  var qtyEl = ctx.$("[data-draw-qty]");
  var year = (ctx.year && ctx.year.year) || new Date().getFullYear();
  var price = Number((ctx.year.luckyDraw && ctx.year.luckyDraw.price) || 50);
  var venue = (ctx.year.venue && ctx.year.venue.name) || "Ascension Church, Aminjikkarai";
  var org = (ctx.site && ctx.site.org) || {};
  var mark = org.logoLight || org.logo || "";
  var markFix = mark && !org.logoLight ? " tk-lockup--fix" : "";

  host.innerHTML =
    '<div class="ticket-preview__frame">' +
    '<div class="ticket-preview__stack" aria-hidden="true"></div>' +
    '<div class="ticket-preview__card">' +
      '<svg class="ticket-preview__fx" viewBox="0 0 460 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true"></svg>' +
      '<div class="ticket-preview__field">' +
        '<p class="tk-eyebrow">Lucky Draw</p>' +
        '<p class="tk-title">Vimusement ' + year + '</p>' +
        '<p class="tk-admit">Admit<span class="tk-name is-empty">Your name</span></p>' +
        (mark
          ? '<div class="tk-lockup"><img src="' + mark + '" alt="" class="tk-lockup__img' + markFix + '">' +
            '<span>' + esc(venue) + '<br>Drawn live on stage on the night</span></div>'
          : '') +
      '</div>' +
      '<div class="ticket-preview__stub">' +
        '<p class="tk-no">No.</p>' +
        '<p class="tk-num">····</p>' +
        '<p class="tk-tag">Provisional</p>' +
        '<p class="tk-meta" data-tk-meta>₹' + price + '</p>' +
      '</div>' +
    '</div>' +
    '</div>' +
    '<p class="ticket-preview__hint">A preview. Your real number is assigned once payment is confirmed.</p>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var fx = host.querySelector(".ticket-preview__fx");
  var nameOut = host.querySelector(".tk-name");
  var metaOut = host.querySelector("[data-tk-meta]");
  var stack = host.querySelector(".ticket-preview__stack");

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }
  function prng(seed) {
    var s = seed % 2147483647 || 1;
    return function () { s = (s * 48271) % 2147483647; return (s - 1) / 2147483646; };
  }

  var COLS = ["231,184,92", "228,138,160", "246,237,225"];   // gold, rose, cream
  function pattern(seed) {
    var r = prng(seed), out = "", i;
    for (i = 0; i < 46; i++) {
      var x = r() * 460, y = r() * 280, s = 3 + r() * 5, rot = (r() * 90) | 0;
      var c = COLS[(r() * 3) | 0], o = (0.05 + r() * 0.12).toFixed(2);
      out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + s.toFixed(1) +
        '" height="' + s.toFixed(1) + '" fill="rgba(' + c + ',' + o + ')" transform="rotate(' +
        rot + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
    }
    var pts = [];
    for (i = 0; i < 9; i++) pts.push([20 + r() * 300, 20 + r() * 240]);
    for (i = 0; i < pts.length - 1; i++) {
      out += '<line x1="' + pts[i][0].toFixed(1) + '" y1="' + pts[i][1].toFixed(1) +
        '" x2="' + pts[i + 1][0].toFixed(1) + '" y2="' + pts[i + 1][1].toFixed(1) +
        '" stroke="rgba(231,184,92,0.2)" stroke-width="0.6"/>';
    }
    pts.forEach(function (p) {
      out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="1.6" fill="rgba(231,184,92,0.5)"/>';
    });
    return out;
  }

  function render() {
    var raw = ((nameEl && nameEl.value) || "").trim();
    fx.innerHTML = pattern(hash(raw ? raw.toLowerCase() : "vimusement" + year));

    if (raw) {
      nameOut.textContent = raw.length > 28 ? raw.slice(0, 27) + "…" : raw;
      nameOut.classList.remove("is-empty");
    } else {
      nameOut.textContent = "Your name";
      nameOut.classList.add("is-empty");
    }

    var q = Math.max(1, parseInt((qtyEl && qtyEl.textContent) || "1", 10) || 1);
    metaOut.textContent = "₹" + price + (q > 1 ? "  ·  1 of " + q : "");

    stack.innerHTML = "";
    for (var i = 1; i < Math.min(q, 3); i++) {
      var el = document.createElement("i");
      el.style.transform = "translate(" + (i * 7) + "px," + (i * 7) + "px)";
      el.style.opacity = String(0.42 - i * 0.13);
      stack.appendChild(el);
    }
  }

  if (nameEl) nameEl.addEventListener("input", render);
  if (qtyEl && "MutationObserver" in window) {
    new MutationObserver(render).observe(qtyEl, { childList: true, characterData: true, subtree: true });
  }
  render();
});
