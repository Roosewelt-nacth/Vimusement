/* ============================================================
   MODULE — donate  (donate.html)
   Zero-fee UPI giving. No gateway.
     1. chips from VIM_YEAR.donation.presets · name + email + wall
     2. GET {api}?action=pledge  -> reference + upi://pay link
     3. show a QR + "open UPI app" + the reference; donor pays in their app
     4. "I've paid" -> GET {api}?action=ipaid  (row -> "Paid?")
     5. a volunteer confirms in the sheet -> the script emails the donor
        and the name joins the supporters wall

   Markup (donate.html):
     [data-donate-chips]   [data-donate-custom]   [data-donate-amount]
     [data-donate-name]    [data-donate-email]    [data-donate-wall]
     [data-donate-go]      [data-donate-status]
     [data-upi-panel]      (built here; hidden until pledged)
   ============================================================ */
Vim.register("donate", function (ctx) {
  var wrap = ctx.$("[data-donate-chips]");
  if (!wrap) return;

  var d = ctx.year.donation || {};
  var api = ctx.year.api || d.api || "";
  var presets = d.presets || [250, 500, 1000, 2500, 5000, 10000];
  var minAmt = Number(d.minAmount || 10);
  var amount = Number(d.default || presets[0]);
  var within = d.confirmWithinText || "usually within a day";

  var custom = ctx.$("[data-donate-custom]");
  var nameEl = ctx.$("[data-donate-name]");
  var emailEl = ctx.$("[data-donate-email]");
  var wallEl = ctx.$("[data-donate-wall]");
  var go     = ctx.$("[data-donate-go]");
  var out    = ctx.$("[data-donate-amount]");
  var status = ctx.$("[data-donate-status]");
  var panel  = ctx.$("[data-upi-panel]");

  var fmt = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  function sync() { if (out) out.textContent = fmt(amount); }
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

  if (wallEl && d.wallByDefault !== false) wallEl.checked = true;

  wrap.innerHTML = presets.map(function (a) {
    return '<button type="button" class="chip" data-amt="' + a + '" aria-pressed="' + (a === amount) + '">' + fmt(a) + "</button>";
  }).join("");
  wrap.addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    ctx.$$(".chip", wrap).forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
    amount = Number(b.dataset.amt);
    if (custom) custom.value = "";
    sync();
  });
  if (custom) custom.addEventListener("input", function () {
    ctx.$$(".chip", wrap).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
    amount = Math.max(0, Math.round(Number(custom.value) || 0));
    sync();
  });

  function qrDataURL(text) {
    if (!window.qrcode) return "";
    var qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createDataURL(5, 4);
  }

  function showUpiPanel(res) {
    var qr = qrDataURL(res.upiUri);
    panel.innerHTML =
      '<div class="upi__head">' +
        '<p class="upi__amount">' + fmt(res.amount) + '</p>' +
        '<p class="upi__ref">Reference <b>' + esc(res.ref) + '</b></p>' +
      '</div>' +
      (qr ? '<img class="upi__qr" alt="UPI QR code" src="' + qr + '">' : "") +
      '<p class="upi__to">to <b>' + esc(res.vpa) + '</b>' +
        ' <button type="button" class="upi__copy" data-copy="' + esc(res.vpa) + '">copy</button></p>' +
      '<a class="btn btn--gold btn--block upi__open" href="' + esc(res.upiUri) + '">Open my UPI app</a>' +
      '<p class="upi__note">Scan the code with any UPI app, or tap the button on your phone. ' +
        'Pay the <b>exact amount</b>. Keep <b>' + esc(res.ref) + '</b> in the note if your app allows.</p>' +
      '<div class="upi__paid">' +
        '<button type="button" class="btn btn--outline btn--block" data-ipaid>I’ve paid</button>' +
        '<div class="upi__utr" hidden>' +
          '<p class="upi__utr-help">Almost there. Please enter the <b>12-digit UPI reference number</b> for your payment so we can confirm your gift quickly.</p>' +
          '<ul class="upi__utr-where">' +
            '<li>Google Pay: “UPI transaction ID”</li>' +
            '<li>PhonePe / Paytm: “UTR” or “UPI Ref. No.”</li>' +
            '<li>BHIM / bank apps: “UPI Ref. ID”</li>' +
          '</ul>' +
          '<label class="field field--text"><input data-utr type="text" inputmode="numeric" autocomplete="off" maxlength="22" placeholder="12-digit reference number"></label>' +
          '<p class="upi__utr-msg" data-utr-msg hidden></p>' +
          '<button type="button" class="btn btn--gold btn--block" data-ipaid-done>Confirm my gift</button>' +
          '<button type="button" class="upi__utr-skip" data-ipaid-skip>I can’t find my reference number</button>' +
        '</div>' +
      '</div>';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    var first = esc(String((nameEl && nameEl.value) || "friend").split(" ")[0]);
    var mailTo = esc((emailEl && emailEl.value) || "");

    panel.querySelector("[data-copy]").addEventListener("click", function () {
      var v = this.getAttribute("data-copy");
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
        .then(function () { panel.querySelector("[data-copy]").textContent = "copied"; })
        .catch(function () {});
    });

    var paidBtn = panel.querySelector("[data-ipaid]");
    var utrBox = panel.querySelector(".upi__utr");
    var msg = panel.querySelector("[data-utr-msg]");
    paidBtn.addEventListener("click", function () { paidBtn.hidden = true; utrBox.hidden = false; panel.querySelector("[data-utr]").focus(); });

    function finish(utr) {
      var pp = { action: "ipaid", ref: res.ref }; if (utr) pp.utr = utr;
      jsonp(pp).catch(function () { return {}; }).then(function () {
        panel.innerHTML = '<div class="upi__done">' +
          '<p>Thank you, ' + first + '. Once we’ve checked your payment against our records, we’ll email <b>' + mailTo + '</b> to confirm your gift' +
          (utr ? ', usually within a few hours' : '') + ', and by the end of the day at the latest.</p>' +
          '<p class="upi__note">Your name joins the supporters wall the moment it’s confirmed.</p></div>';
        window.dispatchEvent(new Event("vim:donation"));
      });
    }
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
    if (!api) { say("Online giving isn’t switched on yet. Please check back soon.", "warn"); return; }
    var nm = ((nameEl && nameEl.value) || "").trim();
    var em = ((emailEl && emailEl.value) || "").trim();
    if (!(amount >= minAmt)) { say("Please choose at least " + fmt(minAmt) + ".", "warn"); return; }
    if (!nm) { say("Please add your name.", "warn"); nameEl && nameEl.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say("Please add a valid email so we can confirm your gift.", "warn"); emailEl && emailEl.focus(); return; }

    go.disabled = true;
    say("Setting up your payment…");
    var wall = wallEl && !wallEl.checked ? "no" : "yes";
    jsonp({ action: "pledge", amount: amount, name: nm, email: em, wall: wall })
      .then(function (res) {
        go.disabled = false;
        if (res.error || !res.upiUri) { say(res.error || "Could not start the payment.", "warn"); return; }
        say("");
        showUpiPanel(res);
      })
      .catch(function () { go.disabled = false; say("Network problem. Please try again.", "warn"); });
  }

  if (go) go.addEventListener("click", function (e) { e.preventDefault(); begin(); });
  sync();
});
