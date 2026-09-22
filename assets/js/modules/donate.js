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
     [data-donate-name]    [data-donate-email]    [data-donate-phone]
     [data-donate-wall]    [data-donate-go]       [data-donate-status]
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
  var within = ctx.L(d.confirmWithinText) || "usually within a day";

  var funds  = (d.funds || []).slice().sort(function (a, b) { return (a.upTo || 0) - (b.upTo || 0); });
  var custom = ctx.$("[data-donate-custom]");
  var fundsEl = ctx.$("[data-donate-funds]");
  var nameEl = ctx.$("[data-donate-name]");
  var emailEl = ctx.$("[data-donate-email]");
  var phoneEl = ctx.$("[data-donate-phone]");
  var wallEl = ctx.$("[data-donate-wall]");
  var go     = ctx.$("[data-donate-go]");
  var out    = ctx.$("[data-donate-amount]");
  var status = ctx.$("[data-donate-status]");
  var panel  = ctx.$("[data-upi-panel]");

  var fmt = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  function updateFunds() {
    if (!fundsEl || !funds.length) return;
    if (!(amount > 0)) { fundsEl.textContent = ""; fundsEl.classList.remove("is-shown"); return; }
    var row;
    for (var i = 0; i < funds.length; i++) {
      if (amount <= (funds[i].upTo || Infinity)) { row = funds[i]; break; }
    }
    if (!row) row = funds[funds.length - 1];
    var next = ctx.t("donate.funds.prefix").replace("{x}", ctx.L(row.text));
    if (fundsEl.textContent === next && fundsEl.classList.contains("is-shown")) return;
    fundsEl.textContent = next;
    fundsEl.classList.add("is-shown");
    fundsEl.classList.remove("is-swap");
    void fundsEl.offsetWidth;            // restart the little swap pulse
    fundsEl.classList.add("is-swap");
  }
  function sync() { if (out) out.textContent = fmt(amount); updateFunds(); }
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
  /* the backend may return either an error CODE (looked up here) or
     plain English prose (older deployments) — either way this returns
     something displayable, translated when it can be */
  function errText(e) {
    if (!e) return "";
    var t = ctx.t("err." + e);
    return t === "err." + e ? e : t;
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
        '<p class="upi__ref">' + ctx.t("donate.upi.reference") + ' <b>' + esc(res.ref) + '</b></p>' +
      '</div>' +
      (qr ? '<img class="upi__qr" alt="UPI QR code" src="' + qr + '">' : "") +
      '<p class="upi__to">' + ctx.t("donate.upi.to") + ' <b>' + esc(res.vpa) + '</b>' +
        ' <button type="button" class="upi__copy" data-copy="' + esc(res.vpa) + '">' + ctx.t("common.copy") + '</button></p>' +
      '<a class="btn btn--gold btn--block upi__open" href="' + esc(res.upiUri) + '">' + ctx.t("donate.upi.openApp") + '</a>' +
      '<p class="upi__note">' + ctx.t("donate.upi.note").replace("{ref}", esc(res.ref)) + '</p>' +
      '<div class="upi__paid">' +
        '<button type="button" class="btn btn--outline btn--block" data-ipaid>' + ctx.t("donate.upi.paid") + '</button>' +
        '<div class="upi__utr" hidden>' +
          '<p class="upi__utr-help">' + ctx.t("donate.utr.help") + '</p>' +
          '<ul class="upi__utr-where">' +
            '<li>' + ctx.t("donate.utr.whereGpay") + '</li>' +
            '<li>' + ctx.t("donate.utr.wherePhonepe") + '</li>' +
            '<li>' + ctx.t("donate.utr.whereBank") + '</li>' +
          '</ul>' +
          '<label class="field field--text"><input data-utr type="text" inputmode="numeric" autocomplete="off" maxlength="22" placeholder="' + ctx.t("donate.utr.placeholder") + '"></label>' +
          '<p class="upi__utr-msg" data-utr-msg hidden></p>' +
          '<button type="button" class="btn btn--gold btn--block" data-ipaid-done>' + ctx.t("donate.utr.confirm") + '</button>' +
          '<button type="button" class="upi__utr-skip" data-ipaid-skip>' + ctx.t("donate.utr.skip") + '</button>' +
        '</div>' +
      '</div>';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    var first = esc(String((nameEl && nameEl.value) || ctx.t("common.friend")).split(" ")[0]);
    var mailTo = esc((emailEl && emailEl.value) || "");

    panel.querySelector("[data-copy]").addEventListener("click", function () {
      var v = this.getAttribute("data-copy");
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
        .then(function () { panel.querySelector("[data-copy]").textContent = ctx.t("common.copied"); })
        .catch(function () {});
    });

    var paidBtn = panel.querySelector("[data-ipaid]");
    var utrBox = panel.querySelector(".upi__utr");
    var msg = panel.querySelector("[data-utr-msg]");
    paidBtn.addEventListener("click", function () { paidBtn.hidden = true; utrBox.hidden = false; panel.querySelector("[data-utr]").focus(); });

    function finish(utr) {
      var pp = { action: "ipaid", ref: res.ref }; if (utr) pp.utr = utr;
      jsonp(pp).catch(function () { return {}; }).then(function () {
        var thanks = ctx.t("donate.done.thanks")
          .replace("{first}", first).replace("{mailTo}", mailTo)
          .replace("{utrNote}", utr ? ctx.t("donate.done.utrNote") : "");
        panel.innerHTML = '<div class="upi__done">' +
          '<p>' + thanks + '</p>' +
          '<p class="upi__note">' + ctx.t("donate.done.wallNote") + '</p></div>';
        window.dispatchEvent(new Event("vim:donation"));
      });
    }
    panel.querySelector("[data-ipaid-done]").addEventListener("click", function () {
      var digits = (panel.querySelector("[data-utr]").value || "").replace(/\D/g, "");
      if (digits.length < 12) {
        msg.hidden = false;
        msg.textContent = ctx.t("donate.utr.invalid");
        return;
      }
      finish(digits.slice(-12));
    });
    panel.querySelector("[data-ipaid-skip]").addEventListener("click", function () { finish(""); });
  }

  function begin() {
    if (!api) { say(ctx.t("donate.status.notLive"), "warn"); return; }
    var nm = ((nameEl && nameEl.value) || "").trim();
    var em = ((emailEl && emailEl.value) || "").trim();
    if (!(amount >= minAmt)) { say(ctx.t("donate.status.minAmount").replace("{amt}", fmt(minAmt)), "warn"); return; }
    if (!nm) { say(ctx.t("donate.status.needName"), "warn"); nameEl && nameEl.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say(ctx.t("donate.status.needEmail"), "warn"); emailEl && emailEl.focus(); return; }

    go.disabled = true;
    say(ctx.t("donate.status.settingUp"));
    var wall = wallEl && !wallEl.checked ? "no" : "yes";
    var ph = ((phoneEl && phoneEl.value) || "").trim();
    jsonp({ action: "pledge", amount: amount, name: nm, email: em, phone: ph, wall: wall })
      .then(function (res) {
        go.disabled = false;
        if (res.error || !res.upiUri) { say(errText(res.error) || ctx.t("donate.status.couldNotStart"), "warn"); return; }
        say("");
        showUpiPanel(res);
      })
      .catch(function () { go.disabled = false; say(ctx.t("donate.status.networkProblem"), "warn"); });
  }

  if (go) go.addEventListener("click", function (e) { e.preventDefault(); begin(); });
  sync();
});
