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
      var lang = "en";
      try { if (localStorage.getItem("vim-lang") === "ta") lang = "ta"; } catch (e) {}

      var ctx = {
        year: w.VIM_YEAR || {},
        site: w.VIM_SITE || {},
        lang: lang,
        reducedMotion: w.matchMedia("(prefers-reduced-motion: reduce)").matches,
        $:  function (s, r) { return (r || document).querySelector(s); },
        $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
        /* strings.js dictionary lookup — falls back to English, then the
           raw key, so a missing translation is visibly obvious, never blank */
        t: function (key) {
          var S = w.VIM_STRINGS || {};
          var here = (S[lang] && S[lang][key]);
          if (here != null) return here;
          var en = (S.en && S.en[key]);
          return en != null ? en : key;
        },
        /* resolves a bilingual config value {en:"..", ta:".."} to a plain
           string for the current language — anything else passes through */
        L: function (v) {
          if (v && typeof v === "object" && (v.en != null || v.ta != null)) {
            return (v[lang] != null ? v[lang] : v.en) || "";
          }
          return v;
        }
      };
      this._mods.forEach(function (m) {
        try { m.fn(ctx); }
        catch (e) { console.error("[Vim] module '" + m.name + "' failed:", e); }
      });
    }
  };

  w.Vim = Vim;
})(window);
