/* ============================================================
   MODULE — render
   Turns VIM_YEAR data into DOM. Keeps markup in the HTML minimal:
     [data-bind="year|venue|tagline|footerNote"]   text
     [data-bind-href="donate"]                      link target
     [data-list="whatsOn|causes|involve|gallery"]   generated cards
     [data-reveal-bar]                              teaser progress %
   ============================================================ */
(function () {
  var ICONS = {
    games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 11h4M8 9v4"/><circle cx="15.5" cy="10.5" r="1"/><circle cx="17.5" cy="13.5" r="1"/></svg>',
    food:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M14 8s0-5 3-5 3 5 3 5-1 3-3 3-3-3-3-3ZM17 11v10"/></svg>',
    movie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M8 5 6 9M13 5l-2 4M18 5l-2 4"/></svg>',
    kids:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3"/><path d="M6 21c0-4 3-7 6-7s6 3 6 7M12 10v4"/></svg>',
    cap:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 9-4 9 4-9 4-9-4Z"/><path d="M7 10.5V15c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5M21 8v5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-9.3-9C1 7.5 3 4.5 6.2 4.5c2 0 3.4 1.2 4.3 2.5.9-1.3 2.3-2.5 4.3-2.5C22 4.5 24 7.5 21.3 11 19 15.6 12 20 12 20Z"/></svg>',
    hands: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 12V4.5a1.5 1.5 0 0 1 3 0V12M14 12V6.5a1.5 1.5 0 0 1 3 0V14c0 3.3-2.7 6-6 6s-6-2.7-6-6v-1.5a1.5 1.5 0 0 1 3 0V14"/></svg>',
    star:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z"/></svg>',
    stall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16v11H4zM3 9l2-5h14l2 5M9 20v-5h6v5"/></svg>'
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  Vim.register("render", function (ctx) {
    var Y = ctx.year, S = ctx.site;

    /* ---- simple text bindings ---- */
    var text = {
      year: Y.year,
      venue: Y.venue && Y.venue.name,
      tagline: S.tagline,
      footerNote: S.footerNote,
      causeNote: Y.causeNote
    };
    ctx.$$("[data-bind]").forEach(function (el) {
      var k = el.getAttribute("data-bind");
      if (text[k] != null && text[k] !== "") el.textContent = text[k];
    });

    /* ---- href bindings ---- */
    var mailFallback = function (subject) {
      return Y.contactEmail
        ? "mailto:" + Y.contactEmail + "?subject=" + encodeURIComponent("Vimusement " + Y.year + " — " + subject)
        : "#involve";
    };
    ctx.$$("[data-bind-href]").forEach(function (el) {
      var k = el.getAttribute("data-bind-href");
      if (k === "donate") el.setAttribute("href", Y.donateUrl || "donate.html");
      if (k === "map" && Y.venue && Y.venue.mapUrl) el.setAttribute("href", Y.venue.mapUrl);
    });

    /* ---- venue block (address + embedded map + directions) ---- */
    (function venue() {
      var v = Y.venue || {};
      var q = encodeURIComponent(v.mapQuery || v.address || v.name || "");
      ctx.$$("[data-venue-name]").forEach(function (el) { if (v.name) el.textContent = v.name; });
      ctx.$$("[data-venue-address]").forEach(function (el) {
        var a = v.address || "";
        // don't repeat the venue name if the address starts with it
        if (v.name && a.toLowerCase().indexOf(v.name.split(",")[0].toLowerCase()) === 0) {
          a = a.replace(/^[^,]+,\s*/, "");
        }
        el.textContent = a || v.name || "";
      });
      ctx.$$("[data-venue-quote]").forEach(function (el) { if (v.quote) el.textContent = v.quote; });

      var dir = ctx.$("[data-venue-directions]");
      if (dir && q) dir.setAttribute("href", v.mapUrl || "https://www.google.com/maps/search/?api=1&query=" + q);

      var map = ctx.$("[data-venue-map]");
      if (map && q) {
        var f = document.createElement("iframe");
        f.src = "https://www.google.com/maps?q=" + q + "&output=embed";
        f.title = "Map to " + (v.name || "the venue");
        f.loading = "lazy";
        f.allowFullscreen = true;
        f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        map.appendChild(f);
      }
    })();

    /* ---- crew caption (the carousel itself is built by modules/crew.js) ---- */
    ctx.$$("[data-crew-caption]").forEach(function (el) {
      if (Y.crew && Y.crew.caption) el.textContent = Y.crew.caption;
    });

    /* ---- lucky draw: price / blurb / prize list ---- */
    (function draw() {
      var L = Y.luckyDraw || {};
      var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
      ctx.$$("[data-draw-price]").forEach(function (el) { if (L.price) el.textContent = money(L.price); });
      ctx.$$("[data-draw-blurb]").forEach(function (el) { if (L.blurb) el.textContent = L.blurb; });
      var accents = ["var(--c-gold)", "var(--c-rose)", "var(--c-teal)", "var(--c-primary-ink)"];
      ctx.$$('[data-list="prizes"]').forEach(function (box) {
        if (!L.prizes) return;
        box.innerHTML = L.prizes.map(function (p, i) {
          return '<li class="prize" style="--dc:' + accents[i % 4] + '">' +
            '<span class="prize__place">' + esc(p.place) + "</span>" +
            '<span class="prize__detail">' + esc(p.detail) + "</span></li>";
        }).join("");
      });
    })();

    /* ---- hide the "not live yet" setup notes once a backend is configured ---- */
    if (Y.api || (Y.donation && Y.donation.api)) {
      ctx.$$(".donate-setup").forEach(function (el) { el.remove(); });
    }

    /* ---- stalls page (stalls.html) ---- */
    (function stalls() {
      var s = Y.stalls || {};
      ctx.$$("[data-stalls-intro]").forEach(function (el) { if (s.intro) el.textContent = s.intro; });
      ctx.$$("[data-stalls-note]").forEach(function (el) { if (s.ratesNote) el.textContent = s.ratesNote; });
      ctx.$$("[data-stalls-wa]").forEach(function (el) { if (s.contactWhatsApp) { el.setAttribute("href", s.contactWhatsApp); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); } });
      ctx.$$("[data-stalls-ig]").forEach(function (el) { if (s.contactInstagram) { el.setAttribute("href", s.contactInstagram); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); } });

      var rates = ctx.$("[data-stalls-rates]");
      if (rates) {
        if (s.rates && s.rates.length) {
          rates.innerHTML = s.rates.map(function (r) {
            return '<li><span>' + esc(r.name) + '</span><b>' + esc(r.price) + '</b></li>';
          }).join("");
        } else {
          rates.innerHTML = '<li class="stalls__tbc">Table rates to be confirmed</li>';
        }
      }
      var open = ctx.$("[data-stalls-open]");
      if (open) {
        if (s.open && s.open.length) {
          open.innerHTML = s.open.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("");
        } else {
          open.innerHTML = '<li class="stalls__tbc">The list of open stalls is being drawn up. Message us to reserve one now.</li>';
        }
      }
    })();

    /* ---- contact links ---- */
    ctx.$$("[data-bind-contact]").forEach(function (el) {
      if (Y.contactEmail) { el.setAttribute("href", "mailto:" + Y.contactEmail); el.textContent = Y.contactEmail; }
    });

    /* ---- social links (hide the element if not configured) ---- */
    ctx.$$("[data-bind-social]").forEach(function (el) {
      var url = (S.social || {})[el.getAttribute("data-bind-social")];
      if (url) { el.setAttribute("href", url); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
      else { el.hidden = true; }
    });

    /* ---- card lists ---- */
    function cardHTML(item, kind) {
      var accent = item.theme ? " card--" + item.theme : "";
      var icon = ICONS[item.icon] || "";
      var cta = "";
      if (kind === "involve") {
        var href = item.form && Y.forms[item.form] ? Y.forms[item.form] : mailFallback(item.title);
        var ext = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : "";
        cta = '<a class="btn btn--gold" href="' + esc(href) + '"' + ext + '>' + esc(item.cta || "Learn more") + "</a>";
      }
      return '<article class="card' + accent + '" data-animate="fade-up">'
           +   '<div class="card__icon">' + icon + "</div>"
           +   "<h3>" + esc(item.title) + "</h3>"
           +   "<p>" + esc(item.text) + "</p>"
           +   cta
           + "</article>";
    }

    function pillarHTML(item) {
      return '<div class="pillar" data-animate="fade-up">'
           +   '<div class="pillar__icon">' + (ICONS[item.icon] || "") + "</div>"
           +   "<h3>" + esc(item.title) + "</h3>"
           +   "<p>" + esc(item.text) + "</p>"
           + "</div>";
    }

    function galleryLocalHTML(list) {
      if (!list || !list.length) {
        return Array.apply(null, Array(6)).map(function () {
          return '<div class="gallery__item gallery__item--empty" data-animate="zoom-in">photo slot<br>assets/img/' + Y.year + "/</div>";
        }).join("");
      }
      return list.map(function (im) {
        return '<figure class="gallery__item" data-animate="zoom-in">'
             + '<img loading="lazy" src="' + esc(im.src) + '" alt="' + esc(im.alt || "") + '"></figure>';
      }).join("");
    }

    /* gallery config may be an array (local) or an object:
       { source: "local" | "widget", widgetHtml: "...", items: [...] } */
    function galleryHTML(el) {
      var g = (Y.images && Y.images.gallery) || {};
      if (Array.isArray(g)) g = { source: "local", items: g };

      if (g.source === "widget" || g.source === "embed" || g.source === "reels") {
        el.setAttribute("data-instagram", "");            // instafeed.js takes over
        el.classList.remove("grid", "grid--auto");
        el.classList.add("gallery--embed");
        el.removeAttribute("data-animate-stagger");
        return "";
      }
      return galleryLocalHTML(g.items);
    }

    function statHTML(s) {
      var num = s.text != null
        ? esc(s.text)
        : '<span data-count-to="' + (Number(s.n) || 0) + '"' +
          (s.prefix ? ' data-count-prefix="' + esc(s.prefix) + '"' : '') +
          (s.suffix ? ' data-count-suffix="' + esc(s.suffix) + '"' : '') + '>' +
          (s.prefix ? esc(s.prefix) : '') + '0' + (s.suffix ? esc(s.suffix) : '') + '</span>';
      return '<div class="stat" data-animate="fade-up">' +
        '<span class="stat__num">' + num + '</span>' +
        '<span class="stat__label">' + esc(s.label) + '</span></div>';
    }

    var lists = {
      whatsOn: function () { return (Y.whatsOn || []).map(function (i) { return cardHTML(i, "whatsOn"); }).join(""); },
      causes:  function () { return (Y.causes  || []).map(pillarHTML).join(""); },
      involve: function () { return (Y.involve || []).map(function (i) { return cardHTML(i, "involve"); }).join(""); },
      impact:  function () { return ((Y.impact && Y.impact.stats) || []).filter(function (s) { return !s.hide; }).map(statHTML).join(""); },
      gallery: galleryHTML
    };
    ctx.$$("[data-list]").forEach(function (el) {
      var fn = lists[el.getAttribute("data-list")];
      if (fn) {
        el.innerHTML = fn(el);
        if (!el.hasAttribute("data-instagram") && !el.hasAttribute("data-animate-stagger")) {
          el.setAttribute("data-animate-stagger", "");
        }
      }
    });

    /* ---- hero photo (optional per-year) ---- */
    var heroImg = ctx.$("[data-hero-photo]");
    if (heroImg && Y.images && Y.images.heroPhoto) {
      heroImg.src = Y.images.heroPhoto;
      heroImg.removeAttribute("hidden");
    }

    /* ---- (banner reveal owns its own bar — see modules/mosaic.js) ---- */

    /* ---- document title / year echoes ---- */
    if (Y.year) {
      document.title = document.title.replace(/\{year\}/g, Y.year);
    }
  });
})();
