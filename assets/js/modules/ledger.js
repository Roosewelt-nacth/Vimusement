/* ============================================================
   MODULE — ledger
   The public ledger behind the 2026 pledge: every rupee in (raised),
   every event cost, and every payout from each fund. No names, ever;
   the committee writes a plain description ("School fees, Class 9").

   Data: VIM_YEAR.api -> GET ?action=ledger ->
         { entries:[{ date, type:"raised"|"cost"|"payout", fund, amount, detail }], updated }
         Rows come from the Ledger tab of the Master sheet
         (see docs/ledger-setup.md). Fund keys match VIM_YEAR.causes[].key.
   Markup: <div data-ledger></div>
   ============================================================ */
Vim.register("ledger", function (ctx) {
  var box = ctx.$("[data-ledger]");
  if (!box) return;

  var api = (ctx.year.api || (ctx.year.donation || {}).api || "").trim();
  var funds = (ctx.year.causes || []).filter(function (c) { return c.share != null; });
  var t = ctx.t;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function rs(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function fmtDate(d) {
    var x = new Date(d);
    if (isNaN(x)) return esc(d);
    return x.toLocaleDateString(ctx.lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  function fundOf(key) {
    for (var i = 0; i < funds.length; i++) if (funds[i].key === key) return funds[i];
    return null;
  }

  function empty(msgKey) {
    box.innerHTML = '<div class="ledger__empty">' +
      '<p class="ledger__empty-title">' + esc(t("ledger.empty.title")) + "</p>" +
      "<p>" + esc(t(msgKey)) + "</p>" +
      '<ul class="ledger__will">' +
        "<li>" + esc(t("ledger.will.in")) + "</li>" +
        "<li>" + esc(t("ledger.will.cost")) + "</li>" +
        "<li>" + esc(t("ledger.will.out")) + "</li>" +
      "</ul></div>";
  }

  function render(data) {
    var rows = (data && data.entries) || [];
    if (!rows.length) return empty("ledger.empty.text");

    var raised = 0, costs = 0, paid = {};
    rows.forEach(function (r) {
      var a = Number(r.amount) || 0;
      if (r.type === "raised") raised += a;
      else if (r.type === "cost") costs += a;
      else if (r.type === "payout") paid[r.fund] = (paid[r.fund] || 0) + a;
    });
    var net = Math.max(0, raised - costs);

    var summary =
      '<div class="ledger__sum">' +
        '<div><span>' + esc(t("ledger.raised")) + "</span><b>" + rs(raised) + "</b></div>" +
        '<div><span>' + esc(t("ledger.costs")) + "</span><b>− " + rs(costs) + "</b></div>" +
        '<div class="is-net"><span>' + esc(t("ledger.net")) + "</span><b>" + rs(net) + "</b></div>" +
      "</div>";

    var fundRows = '<div class="ledger__funds">' + funds.map(function (f) {
      var alloc = net * f.share / 100, out = paid[f.key] || 0, left = alloc - out;
      var pct = alloc > 0 ? Math.min(100, out / alloc * 100) : 0;
      return '<div class="ledger__fund" style="--fund:' + esc(f.color) + '">' +
               '<div class="ledger__fund-head"><b>' + esc(ctx.L(f.title)) + "</b><span>" + esc(f.share) + "% · " + rs(alloc) + "</span></div>" +
               '<div class="ledger__meter"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
               '<div class="ledger__fund-foot"><span>' + esc(t("ledger.paidOut")) + " " + rs(out) + "</span>" +
                 "<span>" + esc(t(f.key === "emergency" ? "ledger.reserve" : "ledger.left")) + " " + rs(left) + "</span></div>" +
             "</div>";
    }).join("") + "</div>";

    var sorted = rows.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    var LIMIT = 25;
    function tableRows(list) {
      return list.map(function (r) {
        var f = fundOf(r.fund);
        var sign = r.type === "raised" ? "+" : "−";
        var label = r.type === "raised" ? t("ledger.type.raised") : r.type === "cost" ? t("ledger.type.cost") : (f ? ctx.L(f.short || f.title) : t("ledger.type.payout"));
        return '<tr class="is-' + esc(r.type) + '"' + (f ? ' style="--fund:' + esc(f.color) + '"' : "") + ">" +
                 "<td>" + fmtDate(r.date) + "</td>" +
                 "<td>" + esc(r.detail) + "</td>" +
                 '<td><span class="ledger__tag">' + esc(label) + "</span></td>" +
                 '<td class="ledger__amt">' + sign + " " + rs(Number(r.amount) || 0) + "</td></tr>";
      }).join("");
    }
    var table =
      '<div class="ledger__table-wrap"><table class="ledger__table">' +
        "<thead><tr><th>" + esc(t("ledger.col.date")) + "</th><th>" + esc(t("ledger.col.what")) + "</th><th>" +
          esc(t("ledger.col.fund")) + '</th><th class="ledger__amt">' + esc(t("ledger.col.amount")) + "</th></tr></thead>" +
        "<tbody>" + tableRows(sorted.slice(0, LIMIT)) + "</tbody></table></div>" +
      (sorted.length > LIMIT ? '<button type="button" class="btn btn--ghost ledger__more">' + esc(t("ledger.showAll")) + " (" + sorted.length + ")</button>" : "");

    box.innerHTML = summary + fundRows + table +
      '<p class="ledger__foot">' + (data.updated ? esc(t("ledger.updated")) + " " + fmtDate(data.updated) + " · " : "") + esc(t("ledger.privacy")) + "</p>";

    var more = box.querySelector(".ledger__more");
    if (more) more.addEventListener("click", function () {
      box.querySelector(".ledger__table tbody").innerHTML = tableRows(sorted);
      more.remove();
    });
  }

  if (!api) return empty("ledger.empty.text");
  box.innerHTML = '<p class="ledger__loading">' + esc(t("ledger.loading")) + "</p>";

  /* JSONP — Apps Script redirects /exec off-origin; fetch() is CORS-blocked from GitHub Pages. */
  var cb = "vimcb_" + Math.random().toString(36).slice(2);
  var sc = document.createElement("script");
  var timer = setTimeout(function () { finish(); empty("ledger.empty.text"); }, 20000);
  function finish() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } sc.remove(); }
  window[cb] = function (data) {
    finish();
    if (data && data.error) return empty("ledger.empty.text");
    render(data);
  };
  sc.onerror = function () { finish(); empty("ledger.empty.text"); };
  sc.src = api + (api.indexOf("?") > -1 ? "&" : "?") + "action=ledger&callback=" + cb;
  document.head.appendChild(sc);
});
