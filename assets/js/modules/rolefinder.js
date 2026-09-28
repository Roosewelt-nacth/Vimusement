/* ============================================================
   MODULE — rolefinder  (involve.html)
   Three taps to a volunteer role: crowd or behind the scenes, what
   you like doing, and when you're free. It picks the role, lights up
   its card below, and writes the WhatsApp message to Austin for you.
   Markup: <div data-rolefinder></div> above the role cards.
   ============================================================ */
Vim.register("rolefinder", function (ctx) {
  var host = ctx.$("[data-rolefinder]");
  if (!host) return;
  function tt(key, fallback) { var v = ctx.t(key); return v === key ? fallback : v; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var wa = ((ctx.year.forms || {}).volunteer || "").split("?")[0];
  var ROLES = ["gate", "food", "games", "stage", "cleanup"];            // same order as the cards below
  var cards = ctx.$$("#volunteer .card-grid > .card");

  var Q = [
    { key: "rf.q1", fb: "Where would you rather be?", opts: [
      { key: "rf.crowd", fb: "In the middle of the crowd", next: 1 },
      { key: "rf.back", fb: "Behind the scenes", next: 2 } ] },
    { key: "rf.q2", fb: "What sounds most like you?", opts: [
      { key: "rf.talk", fb: "Chatting with people", role: "gate" },
      { key: "rf.serve", fb: "Serving food", role: "food" },
      { key: "rf.play", fb: "Running a game", role: "games" } ] },
    { key: "rf.q2", fb: "What sounds most like you?", opts: [
      { key: "rf.tech", fb: "Mics and screens", role: "stage" },
      { key: "rf.tidy", fb: "Getting things done", role: "cleanup" } ] },
    { key: "rf.q3", fb: "When can you come?", when: true, opts: [
      { key: "rf.morning", fb: "Morning" }, { key: "rf.afternoon", fb: "Afternoon" }, { key: "rf.evening", fb: "Evening" } ] }
  ];
  var role = null, step = 0;

  function render(i) {
    var q = Q[i];
    host.innerHTML =
      '<div class="rf" data-step="' + i + '">' +
        '<p class="rf__count">' + (q.when ? 3 : i === 0 ? 1 : 2) + ' / 3</p>' +
        '<p class="rf__q">' + esc(tt(q.key, q.fb)) + '</p>' +
        '<div class="rf__opts">' + q.opts.map(function (o, k) {
          return '<button type="button" class="rf__opt" data-k="' + k + '">' + esc(tt(o.key, o.fb)) + '</button>';
        }).join("") + '</div>' +
      '</div>';
    ctx.$$(".rf__opt", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var o = q.opts[+b.getAttribute("data-k")];
        if (o.role) role = o.role;
        if (q.when) done(tt(o.key, o.fb)); else render(o.next != null ? o.next : 3);
      });
    });
    var first = ctx.$(".rf__opt", host); if (first && step++) first.focus({ preventScroll: true });
  }

  function done(when) {
    var idx = ROLES.indexOf(role);
    var title = tt("involve.roles." + role + ".title", role), text = tt("involve.roles." + role + ".text", "");
    var msg = tt("rf.msg", "Hi Austin, I'd like to volunteer for Vimusement 2026: {role}, {when}.")
      .replace("{role}", title).replace("{when}", when.toLowerCase());
    host.innerHTML =
      '<div class="rf rf--done">' +
        '<p class="rf__count">' + esc(tt("rf.match", "Your match")) + '</p>' +
        '<p class="rf__q">' + esc(title) + '</p>' +
        '<p class="rf__text">' + esc(text) + ' <span class="rf__when">' + esc(when) + '</span></p>' +
        '<div class="rf__opts">' +
          (wa ? '<a class="btn btn--gold" target="_blank" rel="noopener" href="' + esc(wa + "?text=" + encodeURIComponent(msg)) + '">' + esc(tt("rf.send", "Send it to Austin")) + '</a>' : '') +
          '<button type="button" class="rf__again">' + esc(tt("rf.again", "Start again")) + '</button>' +
        '</div>' +
      '</div>';
    cards.forEach(function (c, i) { c.classList.toggle("is-match", i === idx); });
    ctx.$(".rf__again", host).addEventListener("click", function () { role = null; cards.forEach(function (c) { c.classList.remove("is-match"); }); render(0); });
  }
  render(0);
});
