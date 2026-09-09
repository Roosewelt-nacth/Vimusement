/* ============================================================
   MODULE — yearbook  (yearbook.html)
   Add 1-3 photos (camera capture or gallery picker, both compressed
   client-side) + a name, submitted as a real <form target="hidden
   iframe"> POST — not JSONP, not fetch — since Apps Script's redirect
   makes the response unreadable cross-origin either way, and a native
   form navigation is the one request type that isn't subject to CORS
   at all. That means there is no way to confirm success from here; the
   UI stays honest about that ("submitted", never "success").

   Data (write): {api}?action=submitYearbook       (POST, hidden iframe)
   Data (read):  {api}?action=getYearbookPhotos&offset=&limit=  (JSONP)
                 -> { photos:[{name,url,ts}], count, hasMore }

   Markup: see yearbook.html — [data-yb-form] [data-yb-files]
     [data-yb-thumbs] [data-yb-consent] [data-yb-go] [data-yb-status]
     [data-yb-frame] [data-yb-camera*] [data-yb-wall] [data-yb-more]
   ============================================================ */
Vim.register("yearbook", function (ctx) {
  var wall = ctx.$("[data-yb-wall]");
  if (!wall) return;

  var api = ctx.year.api || "";
  var year = (ctx.year && ctx.year.year) || new Date().getFullYear();

  var form = ctx.$("[data-yb-form]");
  var filesInput = ctx.$("[data-yb-files]");
  var thumbsEl = ctx.$("[data-yb-thumbs]");
  var consentEl = ctx.$("[data-yb-consent]");
  var goBtn = ctx.$("[data-yb-go]");
  var statusEl = ctx.$("[data-yb-status]");
  var frame = ctx.$("[data-yb-frame]");
  var moreBtn = ctx.$("[data-yb-more]");

  var cameraOpenBtn = ctx.$("[data-yb-camera-open]");
  var cameraPanel = ctx.$("[data-yb-camera]");
  var video = ctx.$("[data-yb-video]");
  var closeBtn = ctx.$("[data-yb-camera-close]");
  var flipBtn = ctx.$("[data-yb-camera-flip]");
  var shutterBtn = ctx.$("[data-yb-camera-shutter]");
  var cameraMsg = ctx.$("[data-yb-camera-msg]");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function say(m, k) { if (statusEl) { statusEl.textContent = m || ""; statusEl.dataset.kind = k || ""; statusEl.hidden = !m; } }

  /* JSONP — read side only; the write side is a native form POST, see header comment. */
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

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }

  /* soft client-side cooldown — not spoof-proof, just stops accidental double-taps */
  var GATE_KEY = "vim-yb-last-" + year;
  var GATE_MS = 60000;
  function recentlySubmitted() {
    try { return Date.now() - (parseInt(localStorage.getItem(GATE_KEY), 10) || 0) < GATE_MS; }
    catch (e) { return false; }
  }
  function markSubmitted() { try { localStorage.setItem(GATE_KEY, String(Date.now())); } catch (e) {} }

  /* ---------- shared compression: caps at 1200px longest edge, JPEG q0.75 ---------- */
  var MAX_DIM = 1200, MAX_DATA_URL = 1800000;
  function toDataURL(sourceEl, srcW, srcH, mirror) {
    var scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
    var w = Math.max(1, Math.round(srcW * scale)), h = Math.max(1, Math.round(srcH * scale));
    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    var cx = canvas.getContext("2d");
    if (mirror) { cx.translate(w, 0); cx.scale(-1, 1); }
    cx.drawImage(sourceEl, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.75);
  }
  function compressFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () { resolve(toDataURL(img, img.naturalWidth, img.naturalHeight, false)); };
        img.onerror = function () { reject(new Error("bad image")); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error("read failed")); };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- photo state (up to 3), shared by camera + gallery sources ---------- */
  var MAX_PHOTOS = 3;
  var photos = [];
  var hiddenInputs = [0, 1, 2].map(function (i) { return ctx.$('[data-yb-hidden="' + i + '"]'); });

  function syncHidden() {
    hiddenInputs.forEach(function (el, i) { if (el) el.value = photos[i] || ""; });
  }
  function renderThumbs() {
    thumbsEl.innerHTML = photos.map(function (src, i) {
      return '<li class="yb-thumb"><img src="' + src + '" alt="Photo ' + (i + 1) + '">' +
        '<button type="button" class="yb-thumb__x" data-yb-remove="' + i + '" aria-label="Remove this photo">×</button></li>';
    }).join("");
    thumbsEl.querySelectorAll("[data-yb-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        photos.splice(parseInt(btn.getAttribute("data-yb-remove"), 10), 1);
        syncHidden(); renderThumbs();
      });
    });
  }
  function addPhoto(dataUrl) {
    if (photos.length >= MAX_PHOTOS) { say("You can add up to " + MAX_PHOTOS + " photos.", "warn"); return; }
    if (dataUrl.length > MAX_DATA_URL) { say("That photo is too large — please try another.", "warn"); return; }
    photos.push(dataUrl);
    syncHidden(); renderThumbs(); say("");
  }

  if (filesInput) filesInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(filesInput.files || []);
    files.forEach(function (file) {
      if (photos.length >= MAX_PHOTOS) { say("You can add up to " + MAX_PHOTOS + " photos.", "warn"); return; }
      if (!/^image\//.test(file.type)) { say("Please choose image files.", "warn"); return; }
      if (file.size > 15 * 1024 * 1024) { say("That photo is too large — please try another.", "warn"); return; }
      compressFile(file).then(addPhoto).catch(function () { say("Couldn't read that photo — please try another.", "warn"); });
    });
    filesInput.value = "";
  });

  /* ---------- camera capture ---------- */
  var stream = null, facing = "user";
  function stopStream() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } }
  function closeCamera() { stopStream(); if (cameraPanel) cameraPanel.hidden = true; if (cameraMsg) cameraMsg.hidden = true; }
  function checkMultiCam() {
    if (!flipBtn || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function (devs) {
      flipBtn.hidden = devs.filter(function (d) { return d.kind === "videoinput"; }).length < 2;
    }).catch(function () {});
  }
  function startStream() {
    stopStream();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
      .then(function (s) {
        stream = s;
        video.srcObject = s;
        video.style.transform = facing === "user" ? "scaleX(-1)" : "none";
        checkMultiCam();
      })
      .catch(function () {
        if (cameraMsg) { cameraMsg.textContent = "Camera access wasn't available — please choose a photo instead."; cameraMsg.hidden = false; }
        setTimeout(closeCamera, 1800);
      });
  }
  function openCamera() {
    if (photos.length >= MAX_PHOTOS) { say("You can add up to " + MAX_PHOTOS + " photos.", "warn"); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      say("Camera isn't available on this device — please choose a photo instead.", "warn"); return;
    }
    if (cameraPanel) cameraPanel.hidden = false;
    startStream();
  }
  if (cameraOpenBtn) cameraOpenBtn.addEventListener("click", openCamera);
  if (closeBtn) closeBtn.addEventListener("click", closeCamera);
  if (flipBtn) flipBtn.addEventListener("click", function () { facing = facing === "user" ? "environment" : "user"; startStream(); });
  if (shutterBtn) shutterBtn.addEventListener("click", function () {
    if (!video || !video.videoWidth) return;
    var dataUrl = toDataURL(video, video.videoWidth, video.videoHeight, facing === "user");
    addPhoto(dataUrl);
    closeCamera();
  });

  /* ---------- submit: native POST to a hidden iframe, no fetch/JSONP ---------- */
  if (form) form.addEventListener("submit", function (e) {
    if (!api) { e.preventDefault(); say("Uploads aren't switched on yet. Please check back soon.", "warn"); return; }
    if (!consentEl || !consentEl.checked) { e.preventDefault(); say("Please confirm consent to share your photo.", "warn"); return; }
    if (!photos.length) { e.preventDefault(); say("Please add at least one photo.", "warn"); return; }
    if (recentlySubmitted()) { e.preventDefault(); say("Thanks — you just added photos. Give it a moment before adding more.", "warn"); return; }

    goBtn.disabled = true;
    say("Uploading your photos — this can take a moment…");
    markSubmitted();

    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      goBtn.disabled = false;
      photos = []; syncHidden(); renderThumbs();
      form.reset();
      say("Thanks! Your photos are in — they'll appear here once a volunteer approves them.", "ok");
      setTimeout(function () { load(true); }, 1500);
    }
    if (frame) frame.addEventListener("load", finish, { once: true });
    setTimeout(finish, 25000);   // fallback if the iframe's load event never fires
  });

  /* ---------- the scrapbook wall (read side, paginated JSONP) ---------- */
  var TAPE_SVG =
    '<svg viewBox="0 0 60 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="1" y="1" width="58" height="24" rx="2"/></svg>';
  var DOODLE_SVGS = [
    '<svg class="polaroid__doodle" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-9.3-9C1 7.5 3 4.5 6.2 4.5c2 0 3.4 1.2 4.3 2.5.9-1.3 2.3-2.5 4.3-2.5C22 4.5 24 7.5 21.3 11 19 15.6 12 20 12 20Z"/></svg>',
    '<svg class="polaroid__doodle" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.5 7h7.5l-6 4.6 2.3 7.4-6-4.4-6 4.4 2.3-7.4-6-4.6h7.5Z"/></svg>',
    '<svg class="polaroid__doodle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 12c2-4 4-4 6 0s4 4 6 0 4-4 4-4"/></svg>'
  ];

  function cardHTML(photo, i) {
    var h = hash((photo.url || "") + "|" + i);
    var rot = ((h % 240) / 10 - 12).toFixed(1);
    var tapeCorner = h % 2 ? "tl" : "tr";
    var doodle = h % 5 === 0 ? DOODLE_SVGS[h % DOODLE_SVGS.length] : "";
    var name = photo.name ? esc(photo.name) : "A friend of the parish";
    var alt = photo.name ? esc(photo.name) + " at Vimusement" : "A moment from Vimusement";
    return (
      '<li class="polaroid" style="--r:' + rot + 'deg" tabindex="0">' +
        '<span class="polaroid__tape polaroid__tape--' + tapeCorner + '" aria-hidden="true">' + TAPE_SVG + '</span>' +
        '<img class="polaroid__img" src="' + esc(photo.url) + '" loading="lazy" alt="' + alt + '">' +
        '<span class="polaroid__cap">' + name + '</span>' +
        doodle +
      '</li>'
    );
  }

  var OFFSET = 0, LIMIT = 12, LOADING = false;
  function load(reset) {
    if (LOADING || !api) return;
    LOADING = true;
    if (reset) { OFFSET = 0; wall.innerHTML = '<li class="yb-wall__loading">Loading the scrapbook…</li>'; }
    jsonp({ action: "getYearbookPhotos", offset: OFFSET, limit: LIMIT })
      .then(function (data) {
        LOADING = false;
        var items = (data && data.photos) || [];
        if (reset) wall.innerHTML = "";
        if (reset && !items.length) {
          wall.innerHTML = '<li class="yb-wall__empty">Be the first to add a photo.</li>';
        } else {
          var startAt = OFFSET;
          wall.insertAdjacentHTML("beforeend", items.map(function (ph, idx) {
            return cardHTML(ph, startAt + idx);
          }).join(""));
        }
        OFFSET += items.length;
        if (moreBtn) moreBtn.hidden = !(data && data.hasMore);
      })
      .catch(function () {
        LOADING = false;
        if (reset) wall.innerHTML = '<li class="yb-wall__empty">Couldn’t load the scrapbook just now. Reload to try again.</li>';
      });
  }
  if (moreBtn) moreBtn.addEventListener("click", function () { load(false); });

  if (!api) {
    wall.innerHTML = '<li class="yb-wall__empty">The scrapbook opens once this feature is switched on.</li>';
  } else {
    if (form) form.action = api;
    load(true);
  }
});
