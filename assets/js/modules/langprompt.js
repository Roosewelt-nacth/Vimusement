/* ============================================================
   MODULE — langprompt
   A one-time, first-visit prompt asking which language to read the
   site in — English or தமிழ். Shows once, ever, per browser (a
   localStorage flag, separate from the actual vim-lang choice, marks
   it "asked" the moment it's answered OR dismissed either way), then
   never again. The language toggle itself (in the dock's "More"
   menu, or the circle next to the theme toggle on wider screens)
   stays available any time afterward if someone wants to switch.
   ============================================================ */
Vim.register("langprompt", function (ctx) {
  var ASKED_KEY = "vim-lang-asked";
  var LANG_KEY = "vim-lang";

  var alreadyAsked = false, alreadyChosen = false;
  try {
    alreadyAsked = localStorage.getItem(ASKED_KEY) === "1";
    alreadyChosen = localStorage.getItem(LANG_KEY) === "ta"; // only "ta" is ever stored; "en" removes the key
  } catch (e) { alreadyAsked = true; } // storage unavailable — don't nag every load
  if (alreadyAsked || alreadyChosen) return;

  var dock = ctx.$("[data-dock]");
  if (!dock) return; // no dock on this page (e.g. the staff counter) — nowhere to point people to switch later

  function mark() { try { localStorage.setItem(ASKED_KEY, "1"); } catch (e) {} }

  var card = document.createElement("div");
  card.className = "lang-prompt glass-panel";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "Choose your language");
  card.innerHTML =
    '<button type="button" class="lang-prompt__x" data-x aria-label="Dismiss">×</button>' +
    '<p class="lang-prompt__q">View this site in —</p>' +
    '<div class="lang-prompt__row">' +
      '<button type="button" class="btn btn--gold lang-prompt__opt" data-choose="en">English</button>' +
      '<button type="button" class="btn btn--outline lang-prompt__opt" data-choose="ta">தமிழ்</button>' +
    '</div>';
  document.body.appendChild(card);

  requestAnimationFrame(function () { card.classList.add("is-shown"); });

  function close() {
    card.classList.remove("is-shown");
    setTimeout(function () { card.remove(); }, 260);
  }
  card.querySelector("[data-x]").addEventListener("click", function () { mark(); close(); });
  ctx.$$("[data-choose]", card).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-choose");
      mark();
      try {
        if (lang === "ta") localStorage.setItem(LANG_KEY, "ta"); else localStorage.removeItem(LANG_KEY);
      } catch (e) {}
      if (lang === "ta") { location.reload(); }   // English needs no reload — it's already what's showing
      else close();
    });
  });
});
