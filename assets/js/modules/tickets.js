/* ============================================================
   MODULE — tickets  (tickets.html)
   Self-serve "find my ticket" lookup, for anyone without email
   who lost their SMS. Phone number only — shows every Lucky Draw
   ticket and donation tied to it.

     GET {api}?action=lookupByPhone&phone=..

   Markup (tickets.html):
     [data-lookup-phone]  [data-lookup-go]
     [data-lookup-status] [data-lookup-results]
   ============================================================ */
Vim.register("tickets", function (ctx) {
  var go = ctx.$("[data-lookup-go]");
  if (!go) return;

  var api = ctx.year.api || "";
  var year = (ctx.year && ctx.year.year) || new Date().getFullYear();
  var venue = (ctx.year.venue && ctx.year.venue.name) || "Ascension Church, Aminjikkarai";
  var org = (ctx.site && ctx.site.org) || {};
  var mark = org.logoLight || org.logo || "";
  var markFix = mark && !org.logoLight ? " tk-lockup--fix" : "";
  var phoneEl = ctx.$("[data-lookup-phone]");
  var status = ctx.$("[data-lookup-status]");
  var results = ctx.$("[data-lookup-results]");

  /* same seeded-pattern generator as drawticket.js, so a looked-up ticket
     renders with the identical design language as the one shown at purchase */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }
  function prng(seed) {
    var s = seed % 2147483647 || 1;
    return function () { s = (s * 48271) % 2147483647; return (s - 1) / 2147483646; };
  }
  var COLS = ["231,184,92", "228,138,160", "246,237,225"];
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

  function say(msg, kind) {
    if (!status) return;
    status.textContent = msg || "";
    status.dataset.kind = kind || "";
    status.hidden = !msg;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
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

  /* Real ticket IDs (_nextId in Code.gs) look like "LD-2026-0001" — far
     wider than the 4-char "····" placeholder the gold italic size was
     tuned for. Split off everything but the last dash-segment as a small
     label line, so only the short serial gets the big treatment. */
  function splitId(num) {
    var parts = String(num).split('-');
    if (parts.length < 2) return { prefix: '', tail: num };
    return { prefix: parts.slice(0, -1).join(' · '), tail: parts[parts.length - 1] };
  }

  /* one real ticket card per Lucky Draw number (not a text list) — same
     visual design as the live preview shown at purchase (drawticket.js),
     just filled with the confirmed name/number instead of a provisional one */
  function ticketCard(opts) {
    var idPart = opts.split ? splitId(opts.num) : { prefix: '', tail: opts.num };
    var numHtml = idPart.prefix
      ? '<p class="tk-num-prefix">' + esc(idPart.prefix) + '</p><p class="tk-num tk-num--id">' + esc(idPart.tail) + '</p>'
      : '<p class="tk-num' + (opts.wordy ? ' tk-num--word' : '') + '">' + esc(idPart.tail) + '</p>';
    return '<div class="ticket-preview lookup-ticket">' +
      '<div class="ticket-preview__frame">' +
      '<div class="ticket-preview__card">' +
        '<svg class="ticket-preview__fx" viewBox="0 0 460 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + pattern(hash(opts.seed)) + '</svg>' +
        '<div class="ticket-preview__field">' +
          '<p class="tk-eyebrow">' + esc(opts.eyebrow) + '</p>' +
          '<p class="tk-title">Vimusement ' + year + '</p>' +
          '<p class="tk-admit">' + ctx.t("draw.ticket.admit") + '<span class="tk-name">' + esc(opts.name || ctx.t("tickets.card.guest")) + '</span></p>' +
          (mark
            ? '<div class="tk-lockup"><img src="' + mark + '" alt="" class="tk-lockup__img' + markFix + '">' +
              '<span>' + esc(venue) + '<br>' + ctx.t("draw.ticket.venueCaption") + '</span></div>'
            : '') +
        '</div>' +
        '<div class="ticket-preview__stub">' +
          '<p class="tk-no">' + esc(opts.numLabel) + '</p>' +
          numHtml +
          '<p class="tk-tag">' + esc(opts.status) + '</p>' +
          (opts.meta ? '<p class="tk-meta">' + esc(opts.meta) + '</p>' : '') +
        '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function errText(e) {
    if (!e) return "";
    var t = ctx.t("err." + e);
    return t === "err." + e ? e : t;
  }

  function renderResults(list) {
    var cards = [];
    list.forEach(function (r) {
      if (r.type === 'Lucky Draw') {
        if (r.ids && r.ids.length) {
          r.ids.forEach(function (id) {
            cards.push(ticketCard({
              eyebrow: ctx.t("draw.ticket.eyebrow"), name: r.name, num: id, numLabel: ctx.t("tickets.card.number"),
              status: r.status, meta: r.ref, seed: id, split: true
            }));
          });
        } else {
          cards.push(ticketCard({
            eyebrow: ctx.t("draw.ticket.eyebrow"), name: r.name, num: '····', numLabel: ctx.t("tickets.card.number"),
            status: r.status, meta: r.ref, seed: r.ref
          }));
        }
      } else {
        cards.push(ticketCard({
          eyebrow: ctx.t("tickets.type.donation"), name: r.name, num: r.status, numLabel: ctx.t("tickets.card.status"),
          status: r.ref, meta: '', seed: r.ref, wordy: true
        }));
      }
    });
    results.innerHTML = cards.join("");
    results.hidden = false;
  }

  function begin() {
    if (!api) { say(ctx.t("tickets.err.notLive"), "warn"); return; }
    var phone = ((phoneEl && phoneEl.value) || "").trim();
    if (!phone) { say(ctx.t("tickets.err.needPhone"), "warn"); return; }

    go.setAttribute("aria-disabled", "true");
    results.hidden = true;
    say(ctx.t("tickets.status.looking"));
    jsonp({ action: "lookupByPhone", phone: phone })
      .then(function (res) {
        go.removeAttribute("aria-disabled");
        if (res.error || !res.results || !res.results.length) {
          say(errText(res.error) || ctx.t("tickets.err.noneFound"), "warn");
          return;
        }
        say("");
        renderResults(res.results);
      })
      .catch(function () { go.removeAttribute("aria-disabled"); say(ctx.t("tickets.err.network"), "warn"); });
  }

  go.addEventListener("click", function (e) { e.preventDefault(); begin(); });
  if (phoneEl) {
    phoneEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); begin(); } });
  }

  /* the SMS link is tickets.html?phone=.. — land here already filled in
     and looked up, no typing needed */
  var qs = new URLSearchParams(location.search);
  var qPhone = (qs.get("phone") || "").trim();
  if (qPhone) {
    if (phoneEl) phoneEl.value = qPhone;
    begin();
  }
});
