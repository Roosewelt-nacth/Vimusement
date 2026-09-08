/* ============================================================
   MODULE — movie  (movies.html — screening seat booking)
     1. pick a screening (live "N seats left", from {api}?action=movieInfo)
     2. choose seat count (max set server-side, MOV_MAX) · name + email + phone
     3. GET {api}?action=moviePledge  -> reference + upi://pay link
     4. QR + "open UPI app"; buyer pays in their app
     5. "I've paid" -> GET {api}?action=ipaid  (row -> "Paid?")
     6. a volunteer confirms -> the script issues a Booking ID and
        emails it to the buyer — that code is what's shown at the door

   Markup (movies.html):
     [data-movie-list]                                 screening picker (built here)
     [data-movie-dec] [data-movie-qty] [data-movie-inc] [data-movie-total]
     [data-movie-name] [data-movie-email] [data-movie-phone]
     [data-movie-go] [data-movie-status] [data-upi-panel]
   ============================================================ */
Vim.register("movie", function (ctx) {
  var listEl = ctx.$("[data-movie-list]");
  if (!listEl) return;

  var Y = ctx.year || {};
  var api = Y.api || "";
  var configScreenings = Y.screenings || [];
  var maxSeats = Number(Y.moviesMaxSeats || 4);
  var seats = 1;
  var selected = null;     // the chosen screening's live info, from movieInfo
  var screeningsById = {};

  var decEl = ctx.$("[data-movie-dec]");
  var incEl = ctx.$("[data-movie-inc]");
  var totEl = ctx.$("[data-movie-total]");
  var nameEl = ctx.$("[data-movie-name]");
  var emailEl = ctx.$("[data-movie-email]");
  var phoneEl = ctx.$("[data-movie-phone]");
  var go = ctx.$("[data-movie-go]");
  var status = ctx.$("[data-movie-status]");
  var panel = ctx.$("[data-upi-panel]");
  var formWrap = ctx.$("[data-movie-form]");

  var fmt = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function say(m, k) { if (status) { status.textContent = m || ""; status.dataset.kind = k || ""; status.hidden = !m; } }
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

  /* ---- label a screening: real title, then time, then a plain slot
     number — bookable the moment the room/price is set, even before
     the actual film line-up is announced */
  function screeningLabel(cfg, slotIndex) {
    if (cfg.title) return cfg.title;
    if (cfg.time) return cfg.time;
    return "Slot " + slotIndex;
  }

  /* ---- screening picker ------------------------------------------ */
  function renderList(live) {
    var byVenue = {}, order = [];
    configScreenings.forEach(function (cfg, i) {
      if (!byVenue[cfg.venue]) { byVenue[cfg.venue] = []; order.push(cfg.venue); }
      var n = byVenue[cfg.venue].length + 1;
      byVenue[cfg.venue].push({ cfg: cfg, slotIndex: n });
    });

    listEl.innerHTML = order.map(function (venue) {
      var items = byVenue[venue].map(function (entry) {
        var cfg = entry.cfg;
        var info = live[cfg.id] || { price: cfg.price, capacity: cfg.capacity, remaining: cfg.capacity };
        var full = info.remaining <= 0;
        var label = screeningLabel(cfg, entry.slotIndex);
        return (
          '<button type="button" class="movie-pick' + (full ? " movie-pick--full" : "") + '" data-movie-pick="' + cfg.id + '"' + (full ? " disabled" : "") + '>' +
            '<span class="movie-pick__label">' + esc(label) + (cfg.rating ? '<span class="movie-pick__rating">' + esc(cfg.rating) + '</span>' : "") + '</span>' +
            '<span class="movie-pick__meta">' + fmt(info.price) + ' a seat &middot; ' +
              (full ? "Full" : info.remaining + " of " + info.capacity + " seats left") + '</span>' +
          '</button>'
        );
      }).join("");
      return '<div class="movie-venue"><h3 class="movie-venue__title">' + esc(venue) + '</h3><div class="movie-venue__grid">' + items + '</div></div>';
    }).join("");

    ctx.$$("[data-movie-pick]", listEl).forEach(function (btn) {
      btn.addEventListener("click", function () { pick(btn.getAttribute("data-movie-pick"), live); });
    });
  }

  function loadInfo() {
    if (!api) { listEl.innerHTML = '<p class="donate-status" data-kind="warn">Booking isn’t switched on yet. Please check back soon.</p>'; return; }
    listEl.innerHTML = '<p class="movie-list__loading">Checking seats…</p>';
    jsonp({ action: "movieInfo" })
      .then(function (res) {
        if (res.error) { listEl.innerHTML = '<p class="donate-status" data-kind="warn">' + esc(res.error) + '</p>'; return; }
        if (res.maxSeats) maxSeats = Number(res.maxSeats) || maxSeats;
        (res.screenings || []).forEach(function (s) { screeningsById[s.id] = s; });
        renderList(screeningsById);
      })
      .catch(function () { listEl.innerHTML = '<p class="donate-status" data-kind="warn">Couldn’t reach the server. Reload to try again.</p>'; });
  }

  /* ---- once a screening is picked, reveal the seat/details form --- */
  function pick(id, live) {
    selected = live[id];
    if (!selected) return;
    selected.id = id;
    ctx.$$("[data-movie-pick]", listEl).forEach(function (b) {
      b.classList.toggle("is-selected", b.getAttribute("data-movie-pick") === id);
    });
    seats = 1;
    sync();
    if (formWrap) { formWrap.hidden = false; formWrap.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  }

  function capNow() { return selected ? Math.min(maxSeats, selected.remaining) : maxSeats; }

  function sync() {
    if (qtyElText()) qtyElText().textContent = seats;
    var price = selected ? selected.price : 0;
    if (totEl) totEl.textContent = fmt(seats * price) + " · " + seats + (seats === 1 ? " seat" : " seats");
    if (decEl) decEl.disabled = seats <= 1;
    if (incEl) incEl.disabled = seats >= capNow();
  }
  function qtyElText() { return ctx.$("[data-movie-qty]"); }
  if (decEl) decEl.addEventListener("click", function () { if (seats > 1) { seats--; sync(); } });
  if (incEl) incEl.addEventListener("click", function () { if (seats < capNow()) { seats++; sync(); } });

  function qrDataURL(text) {
    if (!window.qrcode) return "";
    var qr = window.qrcode(0, "M"); qr.addData(text); qr.make();
    return qr.createDataURL(5, 4);
  }

  function showUpiPanel(res) {
    var qr = qrDataURL(res.upiUri);
    panel.innerHTML =
      '<div class="upi__head">' +
        '<p class="upi__amount">' + fmt(res.amount) + '</p>' +
        '<p class="upi__ref">' + res.seats + (res.seats === 1 ? " seat" : " seats") +
          ' · reference <b>' + esc(res.ref) + '</b></p>' +
      '</div>' +
      (qr ? '<img class="upi__qr" alt="UPI QR code" src="' + qr + '">' : "") +
      '<p class="upi__to">to <b>' + esc(res.vpa) + '</b> ' +
        '<button type="button" class="upi__copy" data-copy="' + esc(res.vpa) + '">copy</button></p>' +
      '<a class="btn btn--gold btn--block upi__open" href="' + esc(res.upiUri) + '">Open my UPI app</a>' +
      '<p class="upi__note">Pay the <b>exact amount</b>. Keep <b>' + esc(res.ref) + '</b> in the note if your app allows.</p>' +
      '<div class="upi__paid">' +
        '<button type="button" class="btn btn--outline btn--block" data-ipaid>I’ve paid</button>' +
        '<div class="upi__utr" hidden>' +
          '<p class="upi__utr-help">Almost there. Please enter the <b>12-digit UPI reference number</b> for your payment so we can match it and send your booking code quickly.</p>' +
          '<ul class="upi__utr-where">' +
            '<li>Google Pay: “UPI transaction ID”</li>' +
            '<li>PhonePe / Paytm: “UTR” or “UPI Ref. No.”</li>' +
            '<li>BHIM / bank apps: “UPI Ref. ID”</li>' +
          '</ul>' +
          '<label class="field field--text"><input data-utr type="text" inputmode="numeric" autocomplete="off" maxlength="22" placeholder="12-digit reference number"></label>' +
          '<p class="upi__utr-msg" data-utr-msg hidden></p>' +
          '<button type="button" class="btn btn--gold btn--block" data-ipaid-done>Send my booking code</button>' +
          '<button type="button" class="upi__utr-skip" data-ipaid-skip>I can’t find my reference number</button>' +
        '</div>' +
      '</div>';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    var first = esc(String((nameEl && nameEl.value) || "friend").split(" ")[0]);
    var mailTo = esc((emailEl && emailEl.value) || "");

    panel.querySelector("[data-copy]").addEventListener("click", function () {
      var v = this.getAttribute("data-copy"), self = this;
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
        .then(function () { self.textContent = "copied"; }).catch(function () {});
    });
    var paidBtn = panel.querySelector("[data-ipaid]"), utrBox = panel.querySelector(".upi__utr");
    paidBtn.addEventListener("click", function () { paidBtn.hidden = true; utrBox.hidden = false; panel.querySelector("[data-utr]").focus(); });

    function finish(utr) {
      var p = { action: "ipaid", ref: res.ref }; if (utr) p.utr = utr;
      jsonp(p).catch(function () { return {}; }).then(function () {
        panel.innerHTML = '<div class="upi__done">' +
          '<p>Thank you, ' + first + '. Once we’ve checked your payment against our records, your booking code for <b>' + res.seats + '</b> seat' + (res.seats === 1 ? "" : "s") +
          ' is emailed to <b>' + mailTo + '</b>' + (utr ? ', usually within a few hours' : '') + ', and by the end of the day at the latest.</p>' +
          '<p class="upi__note">Show that code at the door — seats aren’t individually numbered.</p></div>';
      });
    }
    var msg = panel.querySelector("[data-utr-msg]");
    panel.querySelector("[data-ipaid-done]").addEventListener("click", function () {
      var digits = (panel.querySelector("[data-utr]").value || "").replace(/\D/g, "");
      if (digits.length < 12) {
        msg.hidden = false;
        msg.textContent = "That isn’t a 12-digit reference yet. Check your payment confirmation screen.";
        return;
      }
      finish(digits.slice(-12));
    });
    panel.querySelector("[data-ipaid-skip]").addEventListener("click", function () { finish(""); });
  }

  function begin() {
    if (!api) { say("Booking isn’t switched on yet. Please check back soon.", "warn"); return; }
    if (!selected) { say("Pick a screening first.", "warn"); return; }
    var nm = ((nameEl && nameEl.value) || "").trim();
    var em = ((emailEl && emailEl.value) || "").trim();
    var ph = ((phoneEl && phoneEl.value) || "").trim();
    if (!nm) { say("Please add your name.", "warn"); nameEl && nameEl.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say("Please add a valid email. Your booking code goes there.", "warn"); emailEl && emailEl.focus(); return; }
    if (ph.replace(/\D/g, "").length < 10) { say("Please add a valid phone number.", "warn"); phoneEl && phoneEl.focus(); return; }

    go.disabled = true; say("Setting up your payment…");
    jsonp({ action: "moviePledge", screening: selected.id, seats: seats, name: nm, email: em, phone: ph })
      .then(function (res) {
        go.disabled = false;
        if (res.error || !res.upiUri) { say(res.error || "Could not start the payment.", "warn"); return; }
        say(""); showUpiPanel(res);
      })
      .catch(function () { go.disabled = false; say("Network problem. Please try again.", "warn"); });
  }

  if (go) go.addEventListener("click", function (e) { e.preventDefault(); begin(); });
  loadInfo();
});
