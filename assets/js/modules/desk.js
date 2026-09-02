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
  function call(params) {
    return new Promise(function (resolve, reject) {
      if (!api) { reject(new Error("Config didn’t load.")); return; }
      var cb = "vimcb_" + Math.random().toString(36).slice(2);
      var q = Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }).join("&");
      var sc = document.createElement("script");
      var t = setTimeout(function () { done(); reject(new Error("Can’t reach the server (timed out).")); }, 20000);
      function done() { clearTimeout(t); try { delete window[cb]; } catch (e) { window[cb] = undefined; } sc.remove(); }
      window[cb] = function (data) { done(); resolve(data); };
      sc.onerror = function () { done(); reject(new Error("Can’t reach the server.")); };
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
    if (!api) { mount.innerHTML = deskShell('<p class="desk__msg">No backend configured.</p>'); return; }
    if (s.token && s.name) renderApp(); else renderGate();
  }

  function deskShell(inner) {
    return '<div class="desk glass-panel"><button type="button" class="desk__x" data-x aria-label="Close">×</button>' + inner + "</div>";
  }
  function wireX() {
    var x = mount.querySelector("[data-x]");
    if (x) x.addEventListener("click", function () { mount.hidden = true; });
  }

  /* ---------- gate ---------- */
  function renderGate() {
    mount.innerHTML = deskShell(
      '<h3>Staff desk</h3><p class="desk__sub">Your username and today’s desk key.</p>' +
      '<label class="field field--text"><input data-u type="text" placeholder="Username" autocomplete="username" autocapitalize="none"></label>' +
      '<label class="field field--text"><input data-k type="password" placeholder="Desk key" autocomplete="off">' +
        '<button type="button" class="field__reveal" data-reveal>show</button></label>' +
      '<button type="button" class="btn btn--gold btn--block" data-go>Log in</button>' +
      '<p class="desk__msg" data-msg></p>');
    wireX();
    var rv = mount.querySelector("[data-reveal]");
    if (rv) rv.addEventListener("click", function () {
      var i = mount.querySelector("[data-k]");
      i.type = i.type === "password" ? "text" : "password";
      rv.textContent = i.type === "password" ? "show" : "hide";
    });
    mount.querySelector("[data-go]").addEventListener("click", function () {
      var u = mount.querySelector("[data-u]").value.trim();
      var k = mount.querySelector("[data-k]").value.trim();
      var msg = mount.querySelector("[data-msg]");
      if (!u || !k) { msg.textContent = "Enter both fields."; return; }
      msg.textContent = "Checking…";
      call({ action: "staffLogin", user: u, k: k }).then(function (res) {
        if (res && res.ok) { s.token = res.token; s.name = res.name; s.user = res.user; s.role = res.role; save(); renderApp(); }
        else msg.textContent = (res && res.error) || "Not recognised.";
      }).catch(function () { msg.textContent = "Can’t reach the server."; });
    });
  }

  /* ---------- app ---------- */
  function renderApp() {
    mount.innerHTML = deskShell(
      '<div class="desk__bar"><div><b>' + esc(s.name) + '</b><span data-shift></span></div>' +
        '<button type="button" class="btn btn--outline" data-end>End shift</button></div>' +
      '<div class="desk__tabs" role="tablist">' +
        '<button type="button" role="tab" data-tab="draw" aria-selected="true">Lucky Draw</button>' +
        '<button type="button" role="tab" data-tab="cash" aria-selected="false">Cash Donation</button></div>' +
      '<div data-panel="draw">' +
        '<p class="desk__price">' + money(PRICE) + ' a ticket</p>' +
        '<div class="qty"><button type="button" class="qty__btn" data-qd>−</button>' +
          '<span class="qty__n" data-qn>1</span>' +
          '<button type="button" class="qty__btn" data-qi>+</button>' +
          '<span class="qty__total" data-qt>' + money(PRICE) + '</span></div>' +
        '<label class="field field--text"><input data-dn type="text" placeholder="Buyer name"></label>' +
        '<label class="field field--text"><input data-dp type="tel" inputmode="tel" placeholder="Phone number"></label>' +
        '<label class="field field--text"><input data-de type="email" inputmode="email" placeholder="Email for the designed ticket (optional)"></label>' +
        '<button type="button" class="btn btn--gold btn--block btn--lg" data-issue>Issue tickets</button>' +
      '</div>' +
      '<div data-panel="cash" hidden>' +
        '<label class="field"><span class="field__prefix">₹</span><input data-ca type="number" inputmode="numeric" min="1" placeholder="Amount received"></label>' +
        '<label class="field field--text"><input data-cn type="text" placeholder="Donor name (optional)"></label>' +
        '<label class="field field--text"><input data-ce type="email" inputmode="email" placeholder="Email for a receipt (optional)"></label>' +
        '<label class="donate-check"><input data-cw type="checkbox" checked><span>Show name on the supporters wall</span></label>' +
        '<button type="button" class="btn btn--gold btn--block btn--lg" data-cashgo>Record donation</button>' +
      '</div>' +
      '<div class="desk__result glass-panel" data-result hidden></div>');
    wireX();
    shift();

    mount.querySelector("[data-end]").addEventListener("click", function () {
      if (!confirm("End this shift? The running total resets.")) return;
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
      if (!name) { alert("Enter the buyer’s name."); return; }
      if (phone.replace(/\D/g, "").length < 10) { alert("Enter the buyer’s phone number."); return; }
      var btn = this; btn.disabled = true; btn.textContent = "Issuing…";
      call({ action: "drawIssueCash", token: s.token, qty: q, name: name, phone: phone, email: email })
        .then(function (res) {
          btn.disabled = false; btn.textContent = "Issue tickets";
          if (res.error) { alert(res.error); return; }
          record(res.amount);
          result('<p class="res__label">' + res.qty + (res.qty === 1 ? " ticket" : " tickets") + " · " + money(res.amount) + ' cash</p>' +
            '<div class="res__ids">' + res.ids.map(function (i) { return "<b>" + esc(i) + "</b>"; }).join("") + '</div>' +
            '<p class="res__note">Read these out / write them on the ticket.' + (email ? " Also emailed to " + esc(email) + "." : "") + '</p>');
          mount.querySelector("[data-dn]").value = mount.querySelector("[data-dp]").value = mount.querySelector("[data-de]").value = "";
          q = 1; qs();
        })
        .catch(function () { btn.disabled = false; btn.textContent = "Issue tickets"; alert("Network problem. Try again."); });
    });

    mount.querySelector("[data-cashgo]").addEventListener("click", function () {
      var amount = Math.round(Number(mount.querySelector("[data-ca]").value) || 0);
      var name = mount.querySelector("[data-cn]").value.trim();
      var email = mount.querySelector("[data-ce]").value.trim();
      var wall = mount.querySelector("[data-cw]").checked ? "yes" : "no";
      if (amount < 1) { alert("Enter an amount."); return; }
      var btn = this; btn.disabled = true; btn.textContent = "Recording…";
      call({ action: "donateCash", token: s.token, amount: amount, name: name, email: email, wall: wall })
        .then(function (res) {
          btn.disabled = false; btn.textContent = "Record donation";
          if (res.error) { alert(res.error); return; }
          record(res.amount);
          result('<p class="res__label">Donation recorded · ' + money(res.amount) + ' cash</p>' +
            '<p class="res__note">Reference ' + esc(res.ref) + (email ? " · receipt emailed" : "") + '</p>');
          mount.querySelector("[data-ca]").value = mount.querySelector("[data-cn]").value = mount.querySelector("[data-ce]").value = "";
          mount.querySelector("[data-cw]").checked = true;
        })
        .catch(function () { btn.disabled = false; btn.textContent = "Record donation"; alert("Network problem. Try again."); });
    });

    function tab(t) {
      mount.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tab === t)); });
      mount.querySelector('[data-panel="draw"]').hidden = t !== "draw";
      mount.querySelector('[data-panel="cash"]').hidden = t !== "cash";
      var r = mount.querySelector("[data-result]"); r.hidden = true; r.innerHTML = "";
    }
    function result(html) {
      var r = mount.querySelector("[data-result]");
      r.innerHTML = html + '<button type="button" class="btn btn--gold btn--block" data-next>Next sale</button>';
      r.hidden = false; r.scrollIntoView({ block: "center" });
      r.querySelector("[data-next]").addEventListener("click", function () { r.hidden = true; r.innerHTML = ""; });
    }
    function shift() {
      mount.querySelector("[data-shift]").textContent = " · " + s.sales + (s.sales === 1 ? " sale" : " sales") + " · " + money(s.amount) + " to hand over";
    }
    function record(amt) { s.sales++; s.amount += amt; save(); shift(); }
  }

  /* auto-open: standalone counter page, a running shift, or ?desk in the URL */
  if (mount.hasAttribute("data-desk-standalone") || (s.token && s.name) || /[?&]desk\b/.test(location.search)) open();
});
