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
  var within = ctx.L(L.confirmWithinText) || "usually within a day";
  var qty = 1;
  var unit = function (n) { return ctx.t(n === 1 ? "draw.unit.ticket" : "draw.unit.tickets"); };

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
  function errText(e) {
    if (!e) return "";
    var t = ctx.t("err." + e);
    return t === "err." + e ? e : t;
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
    if (totEl) totEl.textContent = fmt(qty * price) + " · " + qty + " " + unit(qty);
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
        '<p class="upi__ref">' + res.qty + " " + unit(res.qty) +
          ' · ' + ctx.t("donate.upi.reference").toLowerCase() + ' <b>' + esc(res.ref) + '</b></p>' +
      '</div>' +
      (qr ? '<img class="upi__qr" alt="UPI QR code" src="' + qr + '">' : "") +
      '<p class="upi__to">' + ctx.t("donate.upi.to") + ' <b>' + esc(res.vpa) + '</b> ' +
        '<button type="button" class="upi__copy" data-copy="' + esc(res.vpa) + '">' + ctx.t("common.copy") + '</button></p>' +
      '<a class="btn btn--gold btn--block upi__open" href="' + esc(res.upiUri) + '">' + ctx.t("donate.upi.openApp") + '</a>' +
      '<p class="upi__note">' + ctx.t("draw.upi.note").replace("{ref}", esc(res.ref)) + '</p>' +
      '<div class="upi__paid">' +
        '<button type="button" class="btn btn--outline btn--block" data-ipaid>' + ctx.t("donate.upi.paid") + '</button>' +
        '<div class="upi__utr" hidden>' +
          '<p class="upi__utr-help">' + ctx.t("draw.utr.help").replace("{unit}", unit(res.qty)) + '</p>' +
          '<ul class="upi__utr-where">' +
            '<li>' + ctx.t("donate.utr.whereGpay") + '</li>' +
            '<li>' + ctx.t("donate.utr.wherePhonepe") + '</li>' +
            '<li>' + ctx.t("donate.utr.whereBank") + '</li>' +
          '</ul>' +
          '<label class="field field--text"><input data-utr type="text" inputmode="numeric" autocomplete="off" maxlength="22" placeholder="' + ctx.t("donate.utr.placeholder") + '"></label>' +
          '<p class="upi__utr-msg" data-utr-msg hidden></p>' +
          '<button type="button" class="btn btn--gold btn--block" data-ipaid-done>' + ctx.t("draw.utr.send").replace("{unit}", unit(res.qty)) + '</button>' +
          '<button type="button" class="upi__utr-skip" data-ipaid-skip>' + ctx.t("donate.utr.skip") + '</button>' +
        '</div>' +
      '</div>';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    var first = esc(String((nameEl && nameEl.value) || ctx.t("common.friend")).split(" ")[0]);
    var mailTo = esc((emailEl && emailEl.value) || "");

    panel.querySelector("[data-copy]").addEventListener("click", function () {
      var v = this.getAttribute("data-copy"), self = this;
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
        .then(function () { self.textContent = ctx.t("common.copied"); }).catch(function () {});
    });
    var paidBtn = panel.querySelector("[data-ipaid]"), utrBox = panel.querySelector(".upi__utr");
    paidBtn.addEventListener("click", function () { paidBtn.hidden = true; utrBox.hidden = false; panel.querySelector("[data-utr]").focus(); });

    function finish(utr) {
      var p = { action: "ipaid", ref: res.ref }; if (utr) p.utr = utr;
      jsonp(p).catch(function () { return {}; }).then(function () {
        var thanks = ctx.t("draw.done.thanks")
          .replace("{first}", first).replace("{mailTo}", mailTo)
          .replace("{utrNote}", utr ? ctx.t("donate.done.utrNote") : "");
        panel.innerHTML = '<div class="upi__done">' +
          '<p>' + thanks + '</p>' +
          '<p class="upi__note">' + ctx.t("draw.done.note") + '</p></div>';
      });
    }
    var msg = panel.querySelector("[data-utr-msg]");
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
    if (!api) { say(ctx.t("draw.status.notLive"), "warn"); return; }
    var nm = ((nameEl && nameEl.value) || "").trim();
    var em = ((emailEl && emailEl.value) || "").trim();
    var ph = ((phoneEl && phoneEl.value) || "").trim();
    if (!nm) { say(ctx.t("draw.status.needName"), "warn"); nameEl && nameEl.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say(ctx.t("draw.status.needEmail"), "warn"); emailEl && emailEl.focus(); return; }
    if (ph.replace(/\D/g, "").length < 10) { say(ctx.t("draw.status.needPhone"), "warn"); phoneEl && phoneEl.focus(); return; }

    go.disabled = true; say(ctx.t("draw.status.settingUp"));
    jsonp({ action: "drawPledge", qty: qty, name: nm, email: em, phone: ph })
      .then(function (res) {
        go.disabled = false;
        if (res.error || !res.upiUri) { say(errText(res.error) || ctx.t("draw.status.couldNotStart"), "warn"); return; }
        say(""); showUpiPanel(res);
      })
      .catch(function () { go.disabled = false; say(ctx.t("draw.status.networkProblem"), "warn"); });
  }

  if (go) go.addEventListener("click", function (e) { e.preventDefault(); begin(); });
  sync();
});
