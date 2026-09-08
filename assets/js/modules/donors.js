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

  function load() {
    jsonp({ action: "donors" })
      .then(function (data) {
        render(data && data.donors);
      })
      .catch(function () {
        if (!box.children.length) { box.classList.add("donor-wall","glass-panel"); box.innerHTML = '<p class="donor-wall__empty">Couldn’t load the supporters list just now.</p>'; }
      });

    if (totalEl && d.showTotal) {
      jsonp({ action: "pulse" })
        .then(function (s) {
          if (!s || typeof s.total !== "number") return;
          applyPulse(s.total, s.count || 0);
        })
        .catch(function () {});
    }
  }

  /* ---- the live pulse: an animated count-up + a flash on increase,
     instead of the number silently swapping to a new value ---- */
  var lastTotal = null;
  var ampEl, countEl, pluralEl;
  function ensurePulseDom() {
    if (ampEl) return;
    totalEl.innerHTML =
      '<strong data-pulse-amount>₹0</strong> raised so far from ' +
      '<strong data-pulse-count>0</strong> gift<span data-pulse-plural>s</span>';
    ampEl = totalEl.querySelector("[data-pulse-amount]");
    countEl = totalEl.querySelector("[data-pulse-count]");
    pluralEl = totalEl.querySelector("[data-pulse-plural]");
  }
  function tween(from, to) {
    var dur = 900, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      ampEl.textContent = "₹" + Math.round(from + (to - from) * eased).toLocaleString("en-IN");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function applyPulse(total, count) {
    ensurePulseDom();
    var wrap = ctx.$("[data-donor-total-wrap]");
    var bar = ctx.$("[data-donor-bar]");
    var isFirst = lastTotal === null;

    tween(isFirst ? total : lastTotal, total);
    countEl.textContent = String(count);
    if (pluralEl) pluralEl.hidden = count === 1;
    totalEl.hidden = false;
    if (wrap) wrap.hidden = false;

    if (d.goal > 0 && bar) {
      var pct = Math.max(0, Math.min(100, Math.round((total / d.goal) * 100)));
      bar.style.width = pct + "%";
    }
    if (!isFirst && total > lastTotal && bar) {
      bar.classList.remove("is-pulsing");
      void bar.offsetWidth;               // restart the animation on back-to-back increases
      bar.classList.add("is-pulsing");
    }
    lastTotal = total;
  }

  load();
  setInterval(load, 90000);
  window.addEventListener("vim:donation", function () { setTimeout(load, 1500); });
});
