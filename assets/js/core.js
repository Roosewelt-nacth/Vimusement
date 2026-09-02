/* ============================================================
   VIMUSEMENT — core
   Tiny module registry. Loaded first. Every module registers
   itself here; main.js boots them all once the DOM is ready.
   ============================================================ */
(function (w) {
  "use strict";

  var Vim = {
    version: "1.0",
    _mods: [],

    /* register(name, initFn)  — initFn receives (ctx) */
    register: function (name, fn) {
      this._mods.push({ name: name, fn: fn });
    },

    boot: function () {
      var ctx = {
        year: w.VIM_YEAR || {},
        site: w.VIM_SITE || {},
        reducedMotion: w.matchMedia("(prefers-reduced-motion: reduce)").matches,
        $:  function (s, r) { return (r || document).querySelector(s); },
        $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
      };
      this._mods.forEach(function (m) {
        try { m.fn(ctx); }
        catch (e) { console.error("[Vim] module '" + m.name + "' failed:", e); }
      });
    }
  };

  w.Vim = Vim;
})(window);
