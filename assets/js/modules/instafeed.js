/* ============================================================
   MODULE — instafeed  (home gallery: Instagram content)

   VIM_YEAR.images.gallery.source:
     "reels"  → a styled poster wall. Each card opens the reel in a
                dark lightbox — our design, not Instagram's card.
                reels: [{ year, url, poster?, video? }]
     "widget" → whole recent feed via a behold.so / lightwidget
                snippet in widgetHtml (auto-updating).
     "embed"  → raw official Instagram embeds (posts[]).
     "local"  → own files (items[], handled in render.js).

   External content is lazy: scripts / iframes only load when the
   gallery (or the lightbox) is opened.
   ============================================================ */
Vim.register("instafeed", function (ctx) {
  var el = ctx.$("[data-instagram]");
  if (!el) return;

  var g = (ctx.year.images && ctx.year.images.gallery) || {};
  var mode = g.source;
  var igUrl = (ctx.site.social && ctx.site.social.instagram) || "";

  var ACCENTS = ["var(--c-rose)", "var(--c-gold)", "var(--c-teal)", "var(--c-primary)"];

  /* hand-built fairground scene used as the card art when there's no poster */
  function fairScene(seed) {
    var rnd = (function (s) { return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })(seed * 9301 + 49297);
    var W = 200, H = 340, cx = 128, cy = 138, R = 72, i, a, x, y;

    var stars = "";
    for (i = 0; i < 30; i++) stars += '<circle cx="' + (rnd() * W).toFixed(1) + '" cy="' + (28 + rnd() * 130).toFixed(1) + '" r="' + (rnd() * 1.1 + 0.35).toFixed(2) + '"/>';

    /* bunting drawn as vector (crisp at any size) */
    var bunt = '<path d="M-6 13 Q100 30 206 13" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1"/>';
    for (i = 0; i < 12; i++) {
      var t = i / 11, bx = -6 + t * 212, by = 13 + 34 * (1 - t) * t;
      bunt += '<polygon points="' + bx.toFixed(1) + ',' + by.toFixed(1) + ' ' + (bx + 15).toFixed(1) + ',' + by.toFixed(1) +
              ' ' + (bx + 7.5).toFixed(1) + ',' + (by + 15).toFixed(1) + '" fill="#fff" fill-opacity="' + (i % 2 ? 0.5 : 0.9) + '"/>';
    }

    var spokes = "", cabins = "";
    for (a = 0; a < 12; a++) {
      x = cx + Math.cos(a / 12 * 6.283) * R; y = cy + Math.sin(a / 12 * 6.283) * R;
      spokes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>';
      cabins += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5.2"/>';
    }

    var lights = "";
    for (i = 0; i <= 200; i += 12) {
      y = 44 + Math.sin(i / 200 * 3.14159) * 20 + Math.sin(i / 26) * 2;
      lights += '<circle cx="' + i + '" cy="' + y.toFixed(1) + '" r="1.7"/>';
    }

    var stalls = "";
    for (i = 0; i < 5; i++) {
      x = -8 + i * 46;
      stalls += '<path d="M' + x + ' 300 v-18 h40 v18 z M' + x + ' 282 l6 -12 h28 l6 12 z"/>';
    }

    var crowd = "";
    for (i = 0; i < 22; i++) {
      x = 6 + i * 9 + rnd() * 4;
      crowd += '<circle cx="' + x.toFixed(1) + '" cy="' + (300 + rnd() * 3).toFixed(1) + '" r="3.4"/>';
    }

    return '<svg class="reel-card__scene" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="rsG" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.62"/>' +
      '</linearGradient></defs>' +
      '<circle cx="38" cy="50" r="14" fill="#fff" opacity="0.15"/>' +
      '<g fill="#fff" opacity="0.55">' + stars + '</g>' +
      bunt +
      '<g stroke="#fff" stroke-width="1.3" stroke-opacity="0.3" fill="none"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 9) + '"/>' + spokes + '</g>' +
      '<g fill="#fff" opacity="0.9">' + cabins + '<circle cx="' + cx + '" cy="' + cy + '" r="6"/></g>' +
      '<path d="M' + (cx - 30) + ' 300 L' + cx + ' ' + cy + ' L' + (cx + 30) + ' 300" stroke="#000" stroke-opacity="0.25" stroke-width="4" fill="none"/>' +
      '<path d="M-6 44 Q100 74 206 44" stroke="#fff" stroke-opacity="0.28" fill="none"/>' +
      '<g fill="#fff" opacity="0.85">' + lights + '</g>' +
      '<rect x="0" y="298" width="' + W + '" height="' + (H - 298) + '" fill="#000" opacity="0.3"/>' +
      '<g fill="#000" opacity="0.32">' + stalls + '</g>' +
      '<g fill="#000" opacity="0.4">' + crowd + '</g>' +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#rsG)"/>' +
      '</svg>';
  }

  function shortcode(url) {
    var m = String(url || "").match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i);
    return m ? m[1] : "";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function followBlock(msg) {
    var link = igUrl
      ? '<a class="btn btn--pill-ghost" href="' + igUrl + '" target="_blank" rel="noopener">Follow us on Instagram</a>'
      : "";
    el.classList.remove("gallery--grid", "reel-wall");
    el.innerHTML = '<div class="gallery__skeleton">' + msg + (link ? "<br><br>" + link : "") + "</div>";
  }
  function whenNear(fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { io.disconnect(); fn(); }
    }, { rootMargin: "500px 0px" });
    io.observe(el);
  }

  /* ================= lightbox (filmstrip viewer) ================= */
  var lb, lastFocus, REELS = [], cur = 0;
  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.hidden = true;
    lb.innerHTML =
      '<div class="lightbox__backdrop" data-close></div>' +
      '<div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="Recap reel">' +
        '<button class="lightbox__close" data-close aria-label="Close">' +
          '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<p class="lightbox__year" data-lb-year></p>' +
        '<div class="lightbox__stage">' +
          '<button class="lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Previous reel">' +
            '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
          '</button>' +
          '<div class="lightbox__frame"></div>' +
          '<button class="lightbox__nav lightbox__nav--next" data-lb-next aria-label="Next reel">' +
            '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="lightbox__strip" data-lb-strip role="tablist" aria-label="All reels"></div>' +
      '</div>';
    document.body.appendChild(lb);

    lb.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) return closeLightbox();
      if (e.target.closest("[data-lb-prev]")) return go(cur - 1);
      if (e.target.closest("[data-lb-next]")) return go(cur + 1);
      var chip = e.target.closest("[data-lb-to]");
      if (chip) go(+chip.getAttribute("data-lb-to"));
    });
    addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") go(cur - 1);
      else if (e.key === "ArrowRight") go(cur + 1);
      else if (e.key === "Tab") trapTab(e);
    });

    var strip = ctx.$("[data-lb-strip]", lb);
    strip.innerHTML = REELS.map(function (r, i) {
      return '<button type="button" class="lightbox__thumb" data-lb-to="' + i + '" role="tab" aria-label="' +
        esc(r.year) + ' recap">' + esc(r.year) + '</button>';
    }).join("");
    if (REELS.length < 2) strip.hidden = true;
  }

  function trapTab(e) {
    var f = ctx.$$('button, [href], [tabindex]:not([tabindex="-1"])', lb)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function paintFrame(reel) {
    var frame = ctx.$(".lightbox__frame", lb);
    if (reel.video) {
      frame.innerHTML = '<video src="' + esc(reel.video) + '" controls autoplay playsinline></video>';
    } else {
      var code = shortcode(reel.url);
      frame.innerHTML = '<iframe src="https://www.instagram.com/p/' + esc(code) + '/embed/" ' +
        'title="Vimusement ' + esc(reel.year) + ' recap" allow="autoplay; encrypted-media; clipboard-write" ' +
        'allowfullscreen loading="lazy"></iframe>';
    }
    ctx.$("[data-lb-year]", lb).textContent = "Vimusement " + reel.year;
    ctx.$$("[data-lb-to]", lb).forEach(function (b, i) {
      b.classList.toggle("is-current", i === cur);
      b.setAttribute("aria-selected", String(i === cur));
    });
    var single = REELS.length < 2;
    ctx.$("[data-lb-prev]", lb).hidden = single;
    ctx.$("[data-lb-next]", lb).hidden = single;
  }
  function go(i) {
    if (!REELS.length) return;
    cur = (i % REELS.length + REELS.length) % REELS.length;   // wrap
    paintFrame(REELS[cur]);
  }
  function openLightbox(idx) {
    if (!lb) buildLightbox();
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.documentElement.style.overflow = "hidden";
    go(idx);
    ctx.$(".lightbox__close", lb).focus();
  }
  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    ctx.$(".lightbox__frame", lb).innerHTML = "";           // stop playback
    document.documentElement.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ================= mode: reels ================= */
  function loadReels() {
    var reels = (g.reels || []).filter(function (r) { return r && (r.url || r.video); });
    if (!reels.length) { followBlock(igUrl ? "Recap reels will appear here." : "Add reels to <code>images.gallery.reels</code>."); return; }
    REELS = reels;

    el.classList.add("reel-wall");
    el.setAttribute("data-animate-stagger", "");

    var PLAY = '<span class="reel-card__play" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';

    el.innerHTML = reels.map(function (r, i) {
      var accent = ACCENTS[i % ACCENTS.length];
      var open = '<button type="button" data-reel="' + i + '" data-animate="zoom-in" ' +
                 'aria-label="Play the ' + esc(r.year) + ' recap reel" style="--accent:' + accent + '"';

      if (r.poster) {
        return open.replace("style=", 'class="reel-card" style=') +
          ";background-image:url(" + esc(r.poster) + ')">' +
          '<span class="reel-card__year">' + esc(r.year) + "</span>" + PLAY + "</button>";
      }
      /* designed cover — illustrated fairground scene, no image file */
      var seed = parseInt(String(r.year).replace(/\D/g, ""), 10) || (i + 1);
      return open.replace("style=", 'class="reel-card reel-card--noposter" style=') + '">' +
        fairScene(seed) +
        '<span class="reel-card__grain" aria-hidden="true"></span>' +
        '<span class="reel-card__meta">' +
          '<span class="reel-card__kicker">Recap</span>' +
          '<span class="reel-card__year">' + esc(r.year) + "</span>" +
          '<span class="reel-card__mark">Vimusement</span>' +
        "</span>" + PLAY + "</button>";
    }).join("");

    el.addEventListener("click", function (e) {
      var card = e.target.closest("[data-reel]");
      if (card) openLightbox(+card.getAttribute("data-reel"));
    });
  }

  /* ================= mode: widget ================= */
  function loadWidget() {
    var snippet = (g.widgetHtml || "").trim();
    if (!snippet) { followBlock(igUrl ? "Our latest posts will appear here." : "Paste a widget snippet into <code>images.gallery.widgetHtml</code>."); return; }
    whenNear(function () {
      var tpl = document.createElement("template");
      tpl.innerHTML = snippet;
      el.replaceChildren(tpl.content);
      ctx.$$("script", el).forEach(function (old) {
        var s = document.createElement("script");
        for (var i = 0; i < old.attributes.length; i++) s.setAttribute(old.attributes[i].name, old.attributes[i].value);
        s.textContent = old.textContent;
        old.parentNode.replaceChild(s, old);
      });
    });
  }

  /* ================= mode: embed ================= */
  function loadEmbeds() {
    var posts = (g.posts || [])
      .map(function (p) { return typeof p === "string" ? { url: p } : p; })
      .filter(function (p) { return p && p.url; });
    if (!posts.length) { followBlock("Add post URLs to <code>images.gallery.posts</code>."); return; }
    el.classList.add("gallery--grid");
    el.innerHTML = posts.map(function (p) {
      var cap = p.label ? '<figcaption class="ig-embed__year">' + esc(p.label) + "</figcaption>" : "";
      return '<figure class="ig-embed">' + cap +
             '<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' + esc(p.url) + '" data-instgrm-version="14"></blockquote>' +
             "</figure>";
    }).join("");
    whenNear(function () {
      function render() { if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process(); }
      if (window.instgrm) { render(); return; }
      var s = document.createElement("script");
      s.async = true; s.src = "https://www.instagram.com/embed.js"; s.onload = render;
      document.body.appendChild(s);
    });
  }

  if (mode === "reels") loadReels();
  else if (mode === "embed") loadEmbeds();
  else loadWidget();
});
