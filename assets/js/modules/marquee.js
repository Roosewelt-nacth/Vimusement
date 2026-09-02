/* ============================================================
   MODULE — marquee
   Markup: <div class="marquee"><div class="marquee__track" data-marquee></div></div>
   Fills from VIM_YEAR.marquee, duplicates for a seamless loop,
   and scales the animation duration to the content length.
   ============================================================ */
Vim.register("marquee", function (ctx) {
  var track = ctx.$("[data-marquee]");
  if (!track) return;

  var words = (ctx.year.marquee || []);
  if (!words.length) return;

  function itemHTML(w) { return '<span class="marquee__item">' + w + "</span>"; }

  // two copies -> the -50% keyframe lands exactly on a seam
  track.innerHTML = words.map(itemHTML).join("") + words.map(itemHTML).join("");

  // ~ one word every 2.4s feels right; clamp for very short/long lists
  var dur = Math.max(16, Math.min(48, words.length * 3.4));
  track.style.setProperty("--marquee-dur", dur + "s");
});
