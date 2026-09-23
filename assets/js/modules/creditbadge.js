/* ============================================================
   MODULE — creditbadge
   A small dismissible "who built this?" pill that fades in a few
   seconds after any page finishes loading, floating above the dock.
   Gives the credits page a path that needs no scrolling at all —
   shows once per browser session (not on every page navigated
   during one visit) and auto-dismisses itself if ignored, so it
   nudges without nagging.
   ============================================================ */
Vim.register("creditbadge", function (ctx) {
  var SEEN_KEY = "vim-credit-badge-seen";

  var p = location.pathname.split("/").pop();
  if (p === "credits.html") return; // no point pointing at the page you're already on

  var dock = ctx.$("[data-dock]");
  if (!dock) return; // staff-only pages carry no dock/footer chrome

  var seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { seen = true; }
  if (seen) return;

  function mark() { try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {} }

  var timer = setTimeout(show, 2600);
  window.addEventListener("beforeunload", function () { clearTimeout(timer); });

  function show() {
    mark();
    var card = document.createElement("div");
    card.className = "credit-badge glass-panel";
    card.setAttribute("role", "note");
    card.innerHTML =
      '<a class="credit-badge__link" href="credits.html">' +
        '<span class="credit-badge__dot" aria-hidden="true"></span>' +
        '<span class="credit-badge__text">' + ctx.t("footer.creditBadge") + '</span>' +
      '</a>' +
      '<button type="button" class="credit-badge__x" data-x aria-label="Dismiss">&times;</button>';
    document.body.appendChild(card);
    requestAnimationFrame(function () { card.classList.add("is-shown"); });

    function close() {
      card.classList.remove("is-shown");
      setTimeout(function () { card.remove(); }, 260);
    }
    card.querySelector("[data-x]").addEventListener("click", close);
    setTimeout(close, 9000); // ignored long enough — step aside on its own
  }
});
