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
    heart:  '<path d="M12 20s-7-4.4-9.3-9C1 7.5 3 4.5 6.2 4.5c2 0 3.4 1.2 4.3 2.5.9-1.3 2.3-2.5 4.3-2.5C22 4.5 24 7.5 21.3 11 19 15.6 12 20 12 20Z"/>',
    ticket: '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"/><path d="M14 6v12" stroke-dasharray="1.5 2"/>',
    photos: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 15 5-4 4 3 3-2 6 4"/><circle cx="9" cy="9" r="1.4"/>',
    people: '<path d="M16 11a4 4 0 1 0-8 0M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/>',
    gift:   '<path d="M20 8H4v4h16V8ZM12 8v13M4 12v9h16v-9M12 8S9.5 4 7.5 4 5 6.5 7 8m5 0s2.5-4 4.5-4S19 6.5 17 8"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.home) + '</svg>';
  }
  function currentFile() {
    var p = location.pathname.split("/").pop();
    return (!p || p === "" ) ? "index.html" : p;
  }

  Vim.register("chrome", function (ctx) {
    var S = ctx.site || {};
    var Y = ctx.year || {};
    var pages = S.pages || [];
    var here = currentFile();

    /* ---------- dock ---------- */
    var dock = ctx.$("[data-dock]");
    if (dock && pages.length) {
      var links = pages.filter(function (p) { return !p.cta; }).map(function (p) {
        var active = p.file === here ? ' aria-current="page"' : '';
        return '<a class="dock__link" href="' + p.file + '"' + active + '>' +
          svg(p.icon) + '<span class="dock__label">' + p.label + '</span></a>';
      }).join("");

      var cta = pages.filter(function (p) { return p.cta; })[0];
      var ctaHTML = cta ? (
        '<a class="btn dock__cta" href="' + cta.file + '"' +
          (cta.file === here ? ' aria-current="page"' : '') + ' aria-label="' + cta.label + '">' +
          '<svg class="dock__cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.heart + '</svg>' +
          '<span class="dock__label">' + cta.label + '</span></a>'
      ) : '';

      dock.innerHTML =
        '<div class="dock__inner">' +
          '<a href="index.html" class="dock__brand" aria-label="Vimusement home">' +
            '<svg class="dock__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="1.6"/><path d="M12 3v16M4 11h16M6.3 5.3l11.4 11.4M17.7 5.3 6.3 16.7"/></svg>' +
            '<span>Vimu<b>sement</b></span>' +
          '</a>' +
          '<div class="dock__links">' + links + '</div>' +
          ctaHTML +
          '<button class="theme-toggle" data-theme-toggle aria-label="Switch colour theme">' +
            '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 3.6 3.6M20.4 20.4 19 19M19 5l1.4-1.4M3.6 20.4 5 19"/></svg>' +
          '</button>' +
        '</div>';
    }

    /* ---------- footer ---------- */
    var foot = ctx.$("[data-site-footer]");
    if (foot) {
      var year = Y.year || new Date().getFullYear();
      var ig = (S.social || {}).instagram || "";
      var nav = pages.map(function (p) {
        return '<a href="' + p.file + '">' + p.label + '</a>';
      }).join("");
      foot.className = "footer";
      foot.innerHTML =
        '<div class="wrap">' +
          '<div class="footer__grid">' +
            '<div>' +
              '<a href="index.html" class="footer__brand">Vimu<b>sement</b></a>' +
              '<p class="footer__blurb">An annual fundraiser by the parish community. One night of games and films, turned into scholarships, care and dignity all year.</p>' +
            '</div>' +
            '<div><h4>Pages</h4>' + nav + '</div>' +
            '<div><h4>Reach us</h4>' +
              (Y.contactEmail ? '<a href="mailto:' + Y.contactEmail + '">' + Y.contactEmail + '</a>' : '') +
              (ig ? '<a href="' + ig + '" target="_blank" rel="noopener">Instagram · @victorians.youth</a>' : '') +
              '<a href="programme.html">Ascension Church, Aminjikkarai</a>' +
            '</div>' +
          '</div>' +
          '<p class="footer__fine">Vimusement ' + year + ' · ' + (S.footerNote || "An annual parish fundraiser.") + '</p>' +
          '<p class="footer__staff">For volunteers · <a href="counter.html">Staff desk</a> · <a href="stage.html">Live draw screen</a></p>' +
        '</div>';
    }
  });
})();
