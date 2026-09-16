/* ============================================================
   MODULE — tickets  (tickets.html)
   Self-serve "find my ticket" lookup, for anyone without email
   who lost their SMS. Needs BOTH the phone number and the
   reference code together — same posture as staff needing the
   real UTR to confirm a payment — so no one can browse other
   people's records by guessing a phone number.

     GET {api}?action=lookupByPhone&phone=..&ref=..

   Markup (tickets.html):
     [data-lookup-phone]  [data-lookup-ref]  [data-lookup-go]
     [data-lookup-status] [data-lookup-results]
   ============================================================ */
Vim.register("tickets", function (ctx) {
  var go = ctx.$("[data-lookup-go]");
  if (!go) return;

  var api = ctx.year.api || "";
  var phoneEl = ctx.$("[data-lookup-phone]");
  var refEl = ctx.$("[data-lookup-ref]");
  var status = ctx.$("[data-lookup-status]");
  var results = ctx.$("[data-lookup-results]");

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

  function renderResults(list) {
    results.innerHTML = list.map(function (r) {
      var idsLine = r.ids && r.ids.length
        ? '<p class="lookup-card__ids">Ticket number' + (r.ids.length > 1 ? 's' : '') + ': <b>' + r.ids.map(esc).join(', ') + '</b></p>'
        : '';
      return '<div class="lookup-card">' +
        '<p class="lookup-card__type">' + esc(r.type) + ' · ' + esc(r.ref) + '</p>' +
        '<p class="lookup-card__status" data-status="' + esc(r.status) + '">' + esc(r.status) + '</p>' +
        idsLine +
        '</div>';
    }).join("");
    results.hidden = false;
  }

  function begin() {
    if (!api) { say("Lookups aren't switched on yet. Please check back soon.", "warn"); return; }
    var phone = ((phoneEl && phoneEl.value) || "").trim();
    var ref = ((refEl && refEl.value) || "").trim();
    if (!phone || !ref) { say("Please enter both your phone number and reference code.", "warn"); return; }

    go.setAttribute("aria-disabled", "true");
    results.hidden = true;
    say("Looking up your ticket…");
    jsonp({ action: "lookupByPhone", phone: phone, ref: ref })
      .then(function (res) {
        go.removeAttribute("aria-disabled");
        if (res.error || !res.results || !res.results.length) {
          say(res.error || "No records found for that phone number and reference.", "warn");
          return;
        }
        say("");
        renderResults(res.results);
      })
      .catch(function () { go.removeAttribute("aria-disabled"); say("Network problem. Please try again.", "warn"); });
  }

  go.addEventListener("click", function (e) { e.preventDefault(); begin(); });
  [phoneEl, refEl].forEach(function (el) {
    if (!el) return;
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); begin(); } });
  });
});
