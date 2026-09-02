/* ============================================================
   MODULE — donors
   A quietly scrolling wall of this year's supporters.
   NAMES ONLY — the backend never sends amounts to the site.

   Data: VIM_YEAR.donation.api  ->  GET ?action=donors  ->  { donors:[name…], count }
         (optionally ?action=stats -> { total, count }  when donation.showTotal)

   Markup:  <div data-donor-scroller></div>
            <p data-donor-hint></p>          (optional)
            <div data-donor-total hidden></div> (optional)
   Re-fetches every 90s and whenever a donation completes on this page
   (window event "vim:donation").
   ============================================================ */
Vim.register("donors", function (ctx) {
  var box = ctx.$("[data-donor-scroller]");
  if (!box) return;

  var d = ctx.year.donation || {};
  var api = (ctx.year.api || d.api || "").trim();
  var hintEl = ctx.$("[data-donor-hint]");
  var totalEl = ctx.$("[data-donor-total]");

  if (hintEl && d.scrollerHint) hintEl.textContent = d.scrollerHint;

  if (!api) {
    box.classList.add("donor-wall", "glass-panel");
    box.innerHTML = '<p class="donor-wall__empty">The supporters wall opens once online giving is switched on.</p>';
    return;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  var HEART = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-9.3-9C1 7.5 3 4.5 6.2 4.5c2 0 3.4 1.2 4.3 2.5.9-1.3 2.3-2.5 4.3-2.5C22 4.5 24 7.5 21.3 11 19 15.6 12 20 12 20Z"/></svg>';
  var ACCENTS = ["var(--c-rose)", "var(--c-gold)", "var(--c-teal)", "var(--c-primary-ink)"];

  function render(names) {
    box.classList.add("donor-wall");
    if (!names || !names.length) {
      box.classList.add("glass-panel");
      box.innerHTML = '<p class="donor-wall__empty">Be the first to support this year’s cause.</p>';
      return;
    }
    box.classList.add("glass-panel");
    var items = names.map(function (n, i) {
      return '<li class="donor-chip" style="--dc:' + ACCENTS[i % ACCENTS.length] + '">' + HEART + "<span>" + esc(n) + "</span></li>";
    }).join("");

    var scroll = names.length >= 8 && !ctx.reducedMotion;
    box.innerHTML =
      '<p class="donor-wall__count">' + HEART + " <b>" + names.length + "</b> " +
        (names.length === 1 ? "supporter" : "supporters") + " this year</p>" +
      '<div class="donor-wall__viewport' + (scroll ? " is-scrolling" : "") + '">' +
        '<ul class="donor-wall__track">' + items + (scroll ? items : "") + "</ul>" +
      "</div>";

    if (scroll) {
      box.querySelector(".donor-wall__track")
        .style.setProperty("--donor-dur", Math.min(240, Math.max(24, names.length * 2.2)) + "s");
    }
  }

  function load() {
    fetch(api + (api.indexOf("?") > -1 ? "&" : "?") + "action=donors", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        render(data && data.donors);
      })
      .catch(function () {
        if (!box.children.length) { box.classList.add("donor-wall","glass-panel"); box.innerHTML = '<p class="donor-wall__empty">Couldn’t load the supporters list just now.</p>'; }
      });

    if (totalEl && d.showTotal) {
      fetch(api + (api.indexOf("?") > -1 ? "&" : "?") + "action=stats", { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (s) {
          if (!s || typeof s.total !== "number") return;
          var total = "₹" + Number(s.total).toLocaleString("en-IN");
          totalEl.innerHTML = '<strong>' + total + '</strong> raised so far from <strong>' + (s.count || 0) + '</strong> gift' + (s.count === 1 ? "" : "s");
          totalEl.hidden = false;
          var wrap = ctx.$("[data-donor-total-wrap]");
          if (wrap) wrap.hidden = false;
          if (d.goal > 0) {
            var pct = Math.max(0, Math.min(100, Math.round((s.total / d.goal) * 100)));
            var bar = ctx.$("[data-donor-bar]");
            if (bar) bar.style.width = pct + "%";
          }
        })
        .catch(function () {});
    }
  }

  load();
  setInterval(load, 90000);
  window.addEventListener("vim:donation", function () { setTimeout(load, 1500); });
});
