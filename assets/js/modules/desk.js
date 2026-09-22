/* ============================================================
   MODULE — desk  (staff counter, embedded on money pages)
   A volunteer taps "Staff desk", logs in with their username +
   PIN once (checked against the Staff list), and gets the cash
   counter inline: issue lucky-draw tickets, record cash gifts.
   The login stays for the browser session; every action is
   recorded under their username (+ the _Log audit tab).

   Markup on the page:
     <button data-desk-toggle>Staff desk</button>
     <section data-desk hidden></section>
   ============================================================ */
Vim.register("desk", function (ctx) {
  var mount = ctx.$("[data-desk]");
  if (!mount) return;

  var api = ctx.year.api || "";
  var L = ctx.year.luckyDraw || {};
  var PRICE = Number(L.price || 50);
  var SS = window.sessionStorage;
  var KEYNAME = "vim-desk";
  var s = load() || { token: "", name: "", user: "", sales: 0, amount: 0 };

  function load() { try { return JSON.parse(SS.getItem(KEYNAME)); } catch (e) { return null; } }
  function save() { try { SS.setItem(KEYNAME, JSON.stringify(s)); } catch (e) {} }
  var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function errText(e) {
    if (!e) return "";
    var tt = ctx.t("err." + e);
    return tt === "err." + e ? e : tt;
  }
  function call(params) {
    return new Promise(function (resolve, reject) {
      if (!api) { reject(new Error(ctx.t("desk.err.configNotLoaded"))); return; }
      var cb = "vimcb_" + Math.random().toString(36).slice(2);
      var q = Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }).join("&");
      var sc = document.createElement("script");
      var t = setTimeout(function () { done(); reject(new Error(ctx.t("desk.err.serverTimeout"))); }, 20000);
      function done() { clearTimeout(t); try { delete window[cb]; } catch (e) { window[cb] = undefined; } sc.remove(); }
      window[cb] = function (data) { done(); resolve(data); };
      sc.onerror = function () { done(); reject(new Error(ctx.t("desk.err.serverUnreachable"))); };
      sc.src = api + (api.indexOf("?") > -1 ? "&" : "?") + q + "&callback=" + cb;
      document.head.appendChild(sc);
    });
  }

  ctx.$$("[data-desk-toggle]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); open(); });
  });
  function open() {
    mount.hidden = false;
    render();
    mount.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render() {
    if (!api) { mount.innerHTML = deskShell('<p class="desk__msg">' + ctx.t("desk.noBackend") + '</p>'); return; }
    if (s.token && s.name) renderApp(); else renderGate();
  }

  function deskShell(inner) {
    return '<div class="desk glass-panel"><button type="button" class="desk__x" data-x aria-label="' + ctx.t("desk.close") + '">×</button>' + inner + "</div>";
  }
  function wireX() {
    var x = mount.querySelector("[data-x]");
    if (x) x.addEventListener("click", function () { mount.hidden = true; });
  }

  /* ---------- gate ---------- */
  function renderGate() {
    mount.innerHTML = deskShell(
      '<h3>' + ctx.t("desk.title") + '</h3><p class="desk__sub">' + ctx.t("desk.sub") + '</p>' +
      '<label class="field field--text"><input data-u type="text" placeholder="' + ctx.t("desk.field.username") + '" autocomplete="username" autocapitalize="none"></label>' +
      '<label class="field field--text"><input data-k type="password" placeholder="' + ctx.t("desk.field.deskKey") + '" autocomplete="off">' +
        '<button type="button" class="field__reveal" data-reveal>' + ctx.t("desk.reveal.show") + '</button></label>' +
      '<button type="button" class="btn btn--gold btn--block" data-go>' + ctx.t("desk.login") + '</button>' +
      '<p class="desk__msg" data-msg></p>');
    wireX();
    var rv = mount.querySelector("[data-reveal]");
    if (rv) rv.addEventListener("click", function () {
      var i = mount.querySelector("[data-k]");
      i.type = i.type === "password" ? "text" : "password";
      rv.textContent = i.type === "password" ? ctx.t("desk.reveal.show") : ctx.t("desk.reveal.hide");
    });
    mount.querySelector("[data-go]").addEventListener("click", function () {
      var u = mount.querySelector("[data-u]").value.trim();
      var k = mount.querySelector("[data-k]").value.trim();
      var msg = mount.querySelector("[data-msg]");
      if (!u || !k) { msg.textContent = ctx.t("desk.err.bothFields"); return; }
      msg.textContent = ctx.t("desk.status.checking");
      call({ action: "staffLogin", user: u, k: k }).then(function (res) {
        if (res && res.ok) { s.token = res.token; s.name = res.name; s.user = res.user; s.role = res.role; save(); renderApp(); }
        else msg.textContent = (res && errText(res.error)) || ctx.t("desk.err.notRecognised");
      }).catch(function () { msg.textContent = ctx.t("desk.err.serverUnreachable"); });
    });
  }

  /* ---------- app ---------- */
  function renderApp() {
    mount.innerHTML = deskShell(
      '<div class="desk__bar"><div><b>' + esc(s.name) + '</b><span data-shift></span></div>' +
        '<button type="button" class="btn btn--outline" data-end>' + ctx.t("desk.endShift") + '</button></div>' +
      '<div class="desk__tabs" role="tablist">' +
        '<button type="button" role="tab" data-tab="draw" aria-selected="true">' + ctx.t("draw.ticket.eyebrow") + '</button>' +
        '<button type="button" role="tab" data-tab="cash" aria-selected="false">' + ctx.t("desk.tab.cash") + '</button>' +
        '<button type="button" role="tab" data-tab="confirm" aria-selected="false">' + ctx.t("desk.tab.confirm") + '</button></div>' +
      '<div data-panel="draw">' +
        '<p class="desk__price">' + ctx.t("desk.priceLine").replace("{price}", money(PRICE)) + '</p>' +
        '<div class="qty"><button type="button" class="qty__btn" data-qd>−</button>' +
          '<span class="qty__n" data-qn>1</span>' +
          '<button type="button" class="qty__btn" data-qi>+</button>' +
          '<span class="qty__total" data-qt>' + money(PRICE) + '</span></div>' +
        '<label class="field field--text"><input data-dn type="text" placeholder="' + ctx.t("desk.field.buyerName") + '"></label>' +
        '<label class="field field--text"><input data-dp type="tel" inputmode="tel" placeholder="' + ctx.t("draw.field.phone") + '"></label>' +
        '<label class="field field--text"><input data-de type="email" inputmode="email" placeholder="' + ctx.t("desk.field.emailOptionalTicket") + '"></label>' +
        '<button type="button" class="btn btn--gold btn--block btn--lg" data-issue>' + ctx.t("desk.issueTickets") + '</button>' +
      '</div>' +
      '<div data-panel="cash" hidden>' +
        '<label class="field"><span class="field__prefix">₹</span><input data-ca type="number" inputmode="numeric" min="1" placeholder="' + ctx.t("desk.field.amountReceived") + '"></label>' +
        '<label class="field field--text"><input data-cn type="text" placeholder="' + ctx.t("desk.field.donorNameOptional") + '"></label>' +
        '<label class="field field--text"><input data-ce type="email" inputmode="email" placeholder="' + ctx.t("desk.field.emailOptionalReceipt") + '"></label>' +
        '<label class="donate-check"><input data-cw type="checkbox" checked><span>' + ctx.t("desk.field.showWall") + '</span></label>' +
        '<button type="button" class="btn btn--gold btn--block btn--lg" data-cashgo>' + ctx.t("desk.recordDonation") + '</button>' +
      '</div>' +
      '<div data-panel="confirm" hidden>' +
        '<p class="desk__price">' + ctx.t("desk.confirmIntro") + '</p>' +
        '<label class="field field--text"><input data-cu type="text" inputmode="numeric" maxlength="22" placeholder="' + ctx.t("desk.field.utr") + '"></label>' +
        '<button type="button" class="btn btn--gold btn--block btn--lg" data-cugo>' + ctx.t("desk.confirmPayment") + '</button>' +
      '</div>' +
      '<div class="desk__result glass-panel" data-result hidden></div>');
    wireX();
    shift();

    mount.querySelector("[data-end]").addEventListener("click", function () {
      if (!confirm(ctx.t("desk.endShift.confirm"))) return;
      if (s.token) call({ action: "staffLogout", token: s.token }).catch(function () {});
      SS.removeItem(KEYNAME);
      s = { token: "", name: "", user: "", sales: 0, amount: 0 };
      renderGate();
    });
    mount.querySelectorAll("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () { tab(b.dataset.tab); });
    });

    /* qty */
    var q = 1;
    var qn = mount.querySelector("[data-qn]");
    function qs() { qn.textContent = q; mount.querySelector("[data-qt]").textContent = money(q * PRICE); }
    mount.querySelector("[data-qd]").addEventListener("click", function () { if (q > 1) { q--; qs(); } });
    mount.querySelector("[data-qi]").addEventListener("click", function () { if (q < 100) { q++; qs(); } });

    mount.querySelector("[data-issue]").addEventListener("click", function () {
      var name = mount.querySelector("[data-dn]").value.trim();
      var phone = mount.querySelector("[data-dp]").value.trim();
      var email = mount.querySelector("[data-de]").value.trim();
      if (!name) { alert(ctx.t("desk.err.enterBuyerName")); return; }
      if (phone.replace(/\D/g, "").length < 10) { alert(ctx.t("desk.err.enterBuyerPhone")); return; }
      var btn = this; btn.disabled = true; btn.textContent = ctx.t("desk.issuing");
      call({ action: "drawIssueCash", token: s.token, qty: q, name: name, phone: phone, email: email })
        .then(function (res) {
          btn.disabled = false; btn.textContent = ctx.t("desk.issueTickets");
          if (res.error) { alert(errText(res.error)); return; }
          record(res.amount);
          var unitWord = ctx.t(res.qty === 1 ? "draw.unit.ticket" : "draw.unit.tickets");
          result('<p class="res__label">' + res.qty + " " + unitWord + " · " + money(res.amount) + ' ' + ctx.t("desk.cash") + '</p>' +
            '<div class="res__ids">' + res.ids.map(function (i) { return "<b>" + esc(i) + "</b>"; }).join("") + '</div>' +
            '<p class="res__note">' + ctx.t("desk.result.readOut") + (email ? ctx.t("desk.result.alsoEmailed").replace("{email}", esc(email)) : "") + '</p>');
          mount.querySelector("[data-dn]").value = mount.querySelector("[data-dp]").value = mount.querySelector("[data-de]").value = "";
          q = 1; qs();
        })
        .catch(function () { btn.disabled = false; btn.textContent = ctx.t("desk.issueTickets"); alert(ctx.t("desk.err.networkTryAgain")); });
    });

    mount.querySelector("[data-cashgo]").addEventListener("click", function () {
      var amount = Math.round(Number(mount.querySelector("[data-ca]").value) || 0);
      var name = mount.querySelector("[data-cn]").value.trim();
      var email = mount.querySelector("[data-ce]").value.trim();
      var wall = mount.querySelector("[data-cw]").checked ? "yes" : "no";
      if (amount < 1) { alert(ctx.t("desk.err.enterAmount")); return; }
      var btn = this; btn.disabled = true; btn.textContent = ctx.t("desk.recording");
      call({ action: "donateCash", token: s.token, amount: amount, name: name, email: email, wall: wall })
        .then(function (res) {
          btn.disabled = false; btn.textContent = ctx.t("desk.recordDonation");
          if (res.error) { alert(errText(res.error)); return; }
          record(res.amount);
          result('<p class="res__label">' + ctx.t("desk.result.donationRecorded").replace("{amount}", money(res.amount)) + '</p>' +
            '<p class="res__note">' + ctx.t("desk.result.reference").replace("{ref}", esc(res.ref)) + (email ? ctx.t("desk.result.receiptEmailed") : "") + '</p>');
          mount.querySelector("[data-ca]").value = mount.querySelector("[data-cn]").value = mount.querySelector("[data-ce]").value = "";
          mount.querySelector("[data-cw]").checked = true;
        })
        .catch(function () { btn.disabled = false; btn.textContent = ctx.t("desk.recordDonation"); alert(ctx.t("desk.err.networkTryAgain")); });
    });

    mount.querySelector("[data-cugo]").addEventListener("click", function () {
      var utr = (mount.querySelector("[data-cu]").value || "").replace(/\D/g, "");
      if (utr.length < 12) { alert(ctx.t("desk.err.enterUtr")); return; }
      var btn = this; btn.disabled = true; btn.textContent = ctx.t("desk.confirming");
      call({ action: "confirmByUtr", token: s.token, utr: utr })
        .then(function (res) {
          btn.disabled = false; btn.textContent = ctx.t("desk.confirmPayment");
          if (res.error) { alert(errText(res.error)); return; }
          result('<p class="res__label">' + ctx.t("desk.result.confirmed") + '</p>' +
            '<div class="res__ids">' + res.confirmed.map(function (c) { return "<b>" + esc(c) + "</b>"; }).join("") + '</div>' +
            '<p class="res__note">' + ctx.t("desk.result.emailOnWay") + '</p>');
          mount.querySelector("[data-cu]").value = "";
        })
        .catch(function () { btn.disabled = false; btn.textContent = ctx.t("desk.confirmPayment"); alert(ctx.t("desk.err.networkTryAgain")); });
    });

    function tab(t) {
      mount.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tab === t)); });
      mount.querySelector('[data-panel="draw"]').hidden = t !== "draw";
      mount.querySelector('[data-panel="cash"]').hidden = t !== "cash";
      mount.querySelector('[data-panel="confirm"]').hidden = t !== "confirm";
      var r = mount.querySelector("[data-result]"); r.hidden = true; r.innerHTML = "";
    }
    function result(html) {
      var r = mount.querySelector("[data-result]");
      r.innerHTML = html + '<button type="button" class="btn btn--gold btn--block" data-next>' + ctx.t("desk.nextSale") + '</button>';
      r.hidden = false; r.scrollIntoView({ block: "center" });
      r.querySelector("[data-next]").addEventListener("click", function () { r.hidden = true; r.innerHTML = ""; });
    }
    function shift() {
      var saleWord = ctx.t(s.sales === 1 ? "desk.unit.sale" : "desk.unit.sales");
      mount.querySelector("[data-shift]").textContent = " · " + s.sales + " " + saleWord + " · " + ctx.t("desk.shiftHandover").replace("{amount}", money(s.amount));
    }
    function record(amt) { s.sales++; s.amount += amt; save(); shift(); }
  }

  /* auto-open: standalone counter page, a running shift, or ?desk in the URL */
  if (mount.hasAttribute("data-desk-standalone") || (s.token && s.name) || /[?&]desk\b/.test(location.search)) open();
});
