/* ============================================================
   MODULE — draw  (draw.html — lucky-draw ticket purchase)
     1. choose quantity · name + email (+ phone)
     2. GET {api}?action=drawPledge  -> reference + upi://pay link
     3. QR + "open UPI app"; buyer pays in their app
     4. "I've paid" -> GET {api}?action=ipaid  (rows -> "Paid?")
     5. a volunteer confirms -> the script generates the ticket numbers
        and emails them to the buyer

   Markup (draw.html):
     [data-draw-dec] [data-draw-qty] [data-draw-inc]  [data-draw-total]
     [data-draw-name] [data-draw-email] [data-draw-phone]
     [data-draw-go] [data-draw-status] [data-upi-panel]
   ============================================================ */
Vim.register("draw", function (ctx) {
  var qtyEl = ctx.$("[data-draw-qty]");
  if (!qtyEl) return;

  var L = ctx.year.luckyDraw || {};
  var api = ctx.year.api || "";
  var price = Number(L.price || 50);
  var maxQ = Number(L.maxOnline || 25);
  var within = L.confirmWithinText || "usually within a day";
  var qty = 1;

  var decEl = ctx.$("[data-draw-dec]");
  var incEl = ctx.$("[data-draw-inc]");
  var totEl = ctx.$("[data-draw-total]");
  var nameEl = ctx.$("[data-draw-name]");
  var emailEl = ctx.$("[data-draw-email]");
  var phoneEl = ctx.$("[data-draw-phone]");
  var go = ctx.$("[data-draw-go]");
  var status = ctx.$("[data-draw-status]");
  var panel = ctx.$("[data-upi-panel]");

  var fmt = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function say(m, k) { if (status) { status.textContent = m || ""; status.dataset.kind = k || ""; status.hidden = !m; } }
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
  function sync() {
    qtyEl.textContent = qty;
    if (totEl) totEl.textContent = fmt(qty * price) + " · " + qty + (qty === 1 ? " ticket" : " tickets");
    if (decEl) decEl.disabled = qty <= 1;
    if (incEl) incEl.disabled = qty >= maxQ;
  }
  if (decEl) decEl.addEventListener("click", function () { if (qty > 1) { qty--; sync(); } });
  if (incEl) incEl.addEventListener("click", function () { if (qty < maxQ) { qty++; sync(); } });
  /* price / prizes / blurb are filled by render.js (works on every page) */

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
        '<p class="upi__ref">' + res.qty + (res.qty === 1 ? " ticket" : " tickets") +
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
          '<label class="field field--text"><input data-utr type="text" placeholder="UPI reference / UTR (optional)"></label>' +
          '<button type="button" class="btn btn--gold btn--block" data-ipaid-done>Done</button>' +
        '</div>' +
      '</div>';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    panel.querySelector("[data-copy]").addEventListener("click", function () {
      var v = this.getAttribute("data-copy"), self = this;
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
        .then(function () { self.textContent = "copied"; }).catch(function () {});
    });
    var paidBtn = panel.querySelector("[data-ipaid]"), utrBox = panel.querySelector(".upi__utr");
    paidBtn.addEventListener("click", function () { paidBtn.hidden = true; utrBox.hidden = false; });
    panel.querySelector("[data-ipaid-done]").addEventListener("click", function () {
      var utr = (panel.querySelector("[data-utr]").value || "").trim();
      var p = { action: "ipaid", ref: res.ref }; if (utr) p.utr = utr;
      jsonp(p).catch(function () { return {}; })
        .then(function () {
          panel.innerHTML = '<div class="upi__done">' +
            '<p>You’re in, ' + esc(String((nameEl && nameEl.value) || "friend").split(" ")[0]) + '. ' +
            'Your <b>' + res.qty + '</b> ticket number' + (res.qty === 1 ? "" : "s") +
            ' will be emailed to <b>' + esc((emailEl && emailEl.value) || "") + '</b> once your payment is confirmed, ' + esc(within) + '.</p>' +
            '<p class="upi__note">Winners are drawn live on stage on the night.</p></div>';
        });
    });
  }

  function begin() {
    if (!api) { say("Ticket sales aren’t switched on yet. Please check back soon.", "warn"); return; }
    var nm = ((nameEl && nameEl.value) || "").trim();
    var em = ((emailEl && emailEl.value) || "").trim();
    var ph = ((phoneEl && phoneEl.value) || "").trim();
    if (!nm) { say("Please add your name.", "warn"); nameEl && nameEl.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say("Please add a valid email. Your tickets go there.", "warn"); emailEl && emailEl.focus(); return; }
    if (ph.replace(/\D/g, "").length < 10) { say("Please add a valid phone number.", "warn"); phoneEl && phoneEl.focus(); return; }

    go.disabled = true; say("Setting up your payment…");
    jsonp({ action: "drawPledge", qty: qty, name: nm, email: em, phone: ph })
      .then(function (res) {
        go.disabled = false;
        if (res.error || !res.upiUri) { say(res.error || "Could not start the payment.", "warn"); return; }
        say(""); showUpiPanel(res);
      })
      .catch(function () { go.disabled = false; say("Network problem. Please try again.", "warn"); });
  }

  if (go) go.addEventListener("click", function (e) { e.preventDefault(); begin(); });
  sync();
});
