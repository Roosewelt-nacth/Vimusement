/* ============================================================
   MODULE — chrome
   Renders the ONE bottom dock + the ONE footer on every page,
   from VIM_SITE.pages. Marks the current page active by its
   file name. Keeps every page's <body> tiny:

     <nav class="dock" data-dock aria-label="Primary"></nav>
     <footer class="footer" data-site-footer></footer>

   dock.js still handles the minimise-on-scroll behaviour.
   ============================================================ */
(function () {
  var ICONS = {
    home:   '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/>',
    screen: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>',
    heart:  '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    ticket: '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"/><path d="M14 6v12" stroke-dasharray="1.5 2"/>',
    photos: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 15 5-4 4 3 3-2 6 4"/><circle cx="9" cy="9" r="1.4"/>',
    people: '<path d="M16 11a4 4 0 1 0-8 0M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/>',
    gift:   '<path d="M20 8H4v4h16V8ZM12 8v13M4 12v9h16v-9M12 8S9.5 4 7.5 4 5 6.5 7 8m5 0s2.5-4 4.5-4S19 6.5 17 8"/>',
    code:   '<path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/>',
    star:   '<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    film:   '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 8.5h4M3 12h4M3 15.5h4M17 8.5h4M17 12h4M17 15.5h4"/>',
    more:   '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    lang:   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9Z"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.home) + '</svg>';
  }
  function currentFile() {
    var p = location.pathname.split("/").pop();
    return (!p || p.indexOf(".html") === -1) ? "index.html" : p;
  }

  Vim.register("chrome", function (ctx) {
    var S = ctx.site || {};
    var Y = ctx.year || {};
    var pages = S.pages || [];
    var here = currentFile();

    /* ---------- dock ---------- */
    var dock = ctx.$("[data-dock]");
    if (dock && pages.length) {
      var navPages = pages.filter(function (p) { return !p.cta && p.dock !== false; });
      var secondary = navPages.filter(function (p) { return !p.primary; });

      function linkHTML(p, cls) {
        var active = p.file === here ? ' aria-current="page"' : '';
        return '<a class="dock__link' + (cls ? " " + cls : "") + '" href="' + p.file + '"' + active + '>' +
          svg(p.icon) + '<span class="dock__label">' + ctx.L(p.label) + '</span></a>';
      }
      /* every link renders in the row — tablet/desktop show them all;
         data-dock-secondary is what the narrow-phone CSS hides, folding
         those into the "More" menu below instead (see components.css) */
      var links = navPages.map(function (p) {
        return p.primary ? linkHTML(p) : linkHTML(p).replace('class="dock__link', 'data-dock-secondary class="dock__link');
      }).join("");

      var cta = pages.filter(function (p) { return p.cta; })[0];
      var ctaHTML = cta ? (
        '<a class="btn dock__cta" href="' + cta.file + '"' +
          (cta.file === here ? ' aria-current="page"' : '') + ' aria-label="' + ctx.L(cta.label) + '">' +
          '<svg class="dock__cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.heart + '</svg>' +
          '<span class="dock__label">' + ctx.L(cta.label) + '</span></a>'
      ) : '';

      /* pages without `primary:true` (see site.config.js) never sit
         directly on the bar, at any screen size — they only ever
         live in this "More" popover instead */
      var moreLabel = ctx.t("nav.more");
      /* the credits link isn't a real site.config page — it's the
         same "who built this" destination as the footer crack, just
         placed somewhere that doesn't need scrolling to reach. The
         pulsing dot on its icon mirrors that footer badge so the two
         read as the same signal in two spots. Always present, which
         is also why moreHTML itself is no longer conditional on
         secondary.length — there's now always at least one item. */
      var creditsLinkHTML =
        '<a class="dock__more-link dock__more-credit" role="menuitem" href="credits.html"' +
          (here === "credits.html" ? ' aria-current="page"' : '') + '>' +
          '<span class="dock__more-credit-icon">' + svg("code") + '<span class="dock__more-credit-dot" aria-hidden="true"></span></span>' +
          '<span>' + ctx.t("footer.creditsNav") + '</span>' +
        '</a>';
      var moreHTML =
        '<div class="dock__more-wrap">' +
          '<button class="dock__more" type="button" data-dock-more aria-haspopup="true" aria-expanded="false" aria-label="' + moreLabel + '">' +
            svg("more") +
          '</button>' +
          '<div class="dock__more-menu" data-dock-more-menu role="menu" hidden>' +
            secondary.map(function (p) {
              var active = p.file === here ? ' aria-current="page"' : '';
              return '<a class="dock__more-link" role="menuitem" href="' + p.file + '"' + active + '>' +
                svg(p.icon) + '<span>' + ctx.L(p.label) + '</span></a>';
            }).join("") +
            /* the standalone lang-toggle circle (next to the theme toggle)
               is hidden below the dock's mobile breakpoint — this is its
               replacement there, so switching language is never lost, just
               relocated. Always in the DOM; CSS shows it only when the
               bar version is hidden (see .dock__more-lang in components.css). */
            '<button type="button" role="menuitem" class="dock__more-link dock__more-lang" data-lang-toggle>' +
              svg("lang") + '<span data-lang-toggle-text></span></button>' +
            creditsLinkHTML +
          '</div>' +
        '</div>';

      dock.innerHTML =
        '<div class="dock__inner">' +
          '<a href="index.html" class="dock__brand" aria-label="Vimusement home"' + (here === "index.html" ? ' aria-current="page"' : '') + '>' +
            '<svg class="dock__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="1.6"/><path d="M12 3v16M4 11h16M6.3 5.3l11.4 11.4M17.7 5.3 6.3 16.7"/></svg>' +
            '<span>Vimu<b>sement</b></span>' +
          '</a>' +
          '<div class="dock__links">' + links + '</div>' +
          moreHTML +
          ctaHTML +
          '<button class="theme-toggle" data-theme-toggle aria-label="Switch colour theme">' +
            '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 3.6 3.6M20.4 20.4 19 19M19 5l1.4-1.4M3.6 20.4 5 19"/></svg>' +
          '</button>' +
          '<button class="theme-toggle lang-toggle lang-toggle--bar" data-lang-toggle aria-label="Switch language"></button>' +
        '</div>';
    }

    /* ---------- footer ---------- */
    var foot = ctx.$("[data-site-footer]");
    if (foot) {
      var year = Y.year || new Date().getFullYear();
      var ig = (S.social || {}).instagram || "";
      var nav = pages.map(function (p) {
        return '<a href="' + p.file + '">' + ctx.L(p.label) + '</a>';
      }).join("");
      var org = S.org || {};
      var orgBlock = org.name ? (
        '<a class="footer__org" href="' + (org.url || '#') + '"' + (org.url ? ' target="_blank" rel="noopener"' : '') + '>' +
          (org.logo ? '<img src="' + org.logo + '" alt="' + org.name + '" class="footer__org-logo" onerror="this.remove()">' : '') +
          '<span>' + (org.tagline ? ctx.L(org.tagline) : ctx.t("footer.orgFallback").replace("{org}", org.name)) + '</span>' +
        '</a>'
      ) : '';

      foot.className = "footer";
      foot.innerHTML =
        '<div class="wrap">' +
          '<div class="footer__grid">' +
            '<div>' +
              '<a href="index.html" class="footer__brand">Vimu<b>sement</b></a>' +
              '<p class="footer__blurb">' + ctx.t("footer.blurb") + '</p>' +
              orgBlock +
            '</div>' +
            '<div><h4>' + ctx.t("footer.pages") + '</h4>' + nav + '</div>' +
            '<div><h4>' + ctx.t("footer.reachUs") + '</h4>' +
              (Y.contactEmail ? '<a href="mailto:' + Y.contactEmail + '">' + Y.contactEmail + '</a>' : '') +
              (ig ? '<a href="' + ig + '" target="_blank" rel="noopener">' + ctx.t("footer.instagram") + '</a>' : '') +
              '<a href="programme.html">Ascension Church, Aminjikkarai</a>' +
            '</div>' +
          '</div>' +
          '<p class="footer__fine">Vimusement ' + year + ' · ' + (S.footerNote ? ctx.L(S.footerNote) : "An annual parish fundraiser.") + '</p>' +
          '<p class="footer__staff">' + ctx.t("footer.staffLine") + ' <a href="counter.html">' + ctx.t("footer.staffDesk") + '</a></p>' +
          '<a class="footer__secret" href="credits.html">' +
            '<span class="footer__secret-dot" aria-hidden="true"></span>' +
            '<span class="footer__secret-text">' + ctx.t("footer.credit") + ' <b>Austin</b> &rarr;</span>' +
          '</a>' +
        '</div>';
    }

    /* ---------- org lockup at the top of subpage headers ---------- */
    if (org.name && org.logo) {
      ctx.$$(".pagehead .wrap").forEach(function (w) {
        if (w.querySelector(".hero__org")) return;
        var a = document.createElement("a");
        a.className = "hero__org";
        if (org.url) { a.href = org.url; a.target = "_blank"; a.rel = "noopener"; }
        a.innerHTML = '<img src="' + org.logo + '" alt="" height="44">' +
          '<span>' + ctx.t("hero.orgLockup") + '<br>' + org.name + '</span>';
        w.insertBefore(a, w.firstChild);
      });
    }
  });
})();
