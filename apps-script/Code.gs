/**
 * ============================================================
 * VIMUSEMENT — backend  (Google Apps Script, bound to the Master sheet)
 * ============================================================
 * ONE script for the whole project. Tabs:
 *     Donations   — zero-fee UPI + confirm + notify
 *     LuckyDraw   — ticket sales (UPI + cash counter) + the draw
 *     Staff       — who can use the counter: Username|Name|Role|Active|Notes
 *     _Counters   — running numbers for unique IDs (hidden; do not edit by hand)
 *     _Log        — audit trail: every login / ticket / cash gift / winner (hidden)
 *
 * Two payment channels everywhere:
 *   UPI   : pledge → donor pays → a volunteer confirms vs the bank
 *           statement → row becomes "Confirmed" → IDs issued + email sent
 *   Cash  : a counter volunteer records the sale → row is "Confirmed"
 *           immediately (Channel = Cash) → IDs issued + email sent now
 *
 * ---- Deploy ----
 *   Deploy ▸ New deployment ▸ Web app · Execute as: Me · Access: Anyone
 *   Put the /exec URL in  years/2026.config.js → api
 *
 * ---- Script properties ----
 *   UPI_VPA          parish UPI id, e.g. name@okicici              (REQUIRED)
 *   UPI_NAME         payee name shown in the UPI app               (REQUIRED)
 *   COUNTER_KEY      the shared "desk key" staff type to log in     (REQUIRED for the counter)
 *   ADMIN_KEY        fallback secret for the on-stage draw         (optional)
 *   STAFF_JSON       optional — the staff list as a JSON array instead of the Staff tab:
 *                    [{"user":"roonah","name":"Roonah","role":"admin"}, …]
 *   FROM_NAME        e.g. "Vimusement"                             (optional)
 *   REPLY_TO         committee email                               (optional)
 *   MIN_AMOUNT / MAX_AMOUNT   rupees, default 10 / 200000
 *   DONOR_WALL_LIMIT  names on the supporters wall, default 400
 *   LD_PRICE         lucky-draw ticket price in rupees, default 50
 *   LD_MAX           max tickets per online buyer, default 25
 *   ENABLE_EMAIL_RECONCILE / RECONCILE_LABEL   phase-2 bank-alert auto-confirm
 *
 * ---- Triggers ----
 *   onSheetEdit    — From spreadsheet, On edit
 *   houseKeeping   — Time-driven, every 15 minutes
 * ============================================================
 */

var PROPS = PropertiesService.getScriptProperties();
var _CB = '';   // JSONP callback name for the current request (set in doGet)

/* ---------- tab schemas ---------- */
var T_DON = 'Donations';
var DON_HEADER = ['Timestamp', 'Reference', 'Name', 'Email', 'Amount (INR)',
  'Channel', 'By', 'Donor UPI ref', 'Status', 'Show on wall', 'Confirmed at', 'Notes'];
var DC = { TS:1, REF:2, NAME:3, EMAIL:4, AMOUNT:5, CHANNEL:6, BY:7, UTR:8, STATUS:9, WALL:10, CONFIRMED:11, NOTES:12 };

var T_LD = 'LuckyDraw';
var LD_HEADER = ['Timestamp', 'Ticket ID', 'Reference', 'Name', 'Email', 'Phone',
  'Price (INR)', 'Channel', 'By', 'Status', 'Confirmed at', 'Won', 'Notes', 'Donor UPI ref'];
var LC = { TS:1, TID:2, REF:3, NAME:4, EMAIL:5, PHONE:6, PRICE:7, CHANNEL:8, BY:9, STATUS:10, CONFIRMED:11, WON:12, NOTES:13, UTR:14 };

var STATUS_LIST = ['Pending', 'Paid?', 'Confirmed', 'Cancelled'];
var T_COUNTERS = '_Counters';

var T_STAFF = 'Staff';
var STAFF_HEADER = ['Username', 'Name', 'Role', 'Active', 'Notes'];
var T_LOG = '_Log';
var LOG_HEADER = ['Timestamp', 'Username', 'Action', 'Detail'];

/* ============================================================
   WEB APP ROUTER
   ============================================================ */
function doGet(e) {
  _CB = (e && e.parameter && e.parameter.callback) || '';
  var a = (e && e.parameter && e.parameter.action) || 'donors';
  try {
    switch (a) {
      case 'ping':            return _json({ ok: true, time: new Date().toISOString() });

      /* staff */
      case 'staffLogin':      return _json(staffLogin(e.parameter));
      case 'staffLogout':     return _json(staffLogout(e.parameter));

      /* donations */
      case 'pledge':          return _json(pledge(e.parameter));
      case 'ipaid':           return _json(iPaid(e.parameter));
      case 'confirmByUtr':    return _json(confirmByUtr(e.parameter));
      case 'donateCash':      return _json(donateCash(e.parameter));
      case 'donors':          return _json(getDonors());
      case 'stats':           return _json(getStats());

      /* lucky draw */
      case 'drawInfo':        return _json(drawInfo());
      case 'drawPledge':      return _json(drawPledge(e.parameter));
      case 'drawIssueCash':   return _json(drawIssueCash(e.parameter));
      case 'drawPool':        return _json(drawPool(e.parameter));
      case 'drawRecordWinner':return _json(drawRecordWinner(e.parameter));
      case 'drawStats':       return _json(drawStats());

      default:                return _json({ error: 'unknown action: ' + a });
    }
  } catch (err) {
    return _json({ error: String((err && err.message) || err) });
  }
}
function doPost(e) { return doGet(e); }

function _json(o) {
  var s = JSON.stringify(o);
  if (_CB && /^[A-Za-z_$][\w$]*$/.test(_CB)) {
    return ContentService.createTextOutput(_CB + '(' + s + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   SHARED HELPERS
   ============================================================ */
function _ss() {
  var id = PROPS.getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function _tab(name, header, statusCol) {
  var ss = _ss();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (name.charAt(0) === '_') sh.hideSheet(); }
  var head = sh.getRange(1, 1, 1, header.length).getValues()[0];
  var ok = header.every(function (h, i) { return String(head[i]) === h; });
  if (!ok) {
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  if (statusCol) {
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LIST, true).build();
    sh.getRange(2, statusCol, Math.max(sh.getMaxRows() - 1, 1)).setDataValidation(rule);
  }
  return sh;
}
function _donations() { return _tab(T_DON, DON_HEADER, DC.STATUS); }
function _luckydraw() { return _tab(T_LD, LD_HEADER, LC.STATUS); }

/** running number per prefix, collision-safe (LockService). */
function _nextId(prefix) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = _ss();
    var sh = ss.getSheetByName(T_COUNTERS);
    if (!sh) { sh = ss.insertSheet(T_COUNTERS); sh.appendRow(['Key', 'Value']); sh.hideSheet(); }
    var keys = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 2).getValues();
    var row = -1, val = 0;
    for (var i = 0; i < keys.length; i++) if (String(keys[i][0]) === prefix) { row = i + 2; val = Number(keys[i][1]) || 0; }
    val += 1;
    if (row === -1) sh.appendRow([prefix, val]); else sh.getRange(row, 2).setValue(val);
    var yr = new Date().getFullYear();
    return prefix + '-' + yr + '-' + ('0000' + val).slice(-4);
  } finally {
    lock.releaseLock();
  }
}

function _newRef() {
  var yr = String(new Date().getFullYear()).slice(-2);
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var s = '';
  for (var i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'VIM' + yr + '-' + s;
}

function _upiUri(amount, ref) {
  var vpa = PROPS.getProperty('UPI_VPA');
  var pn = PROPS.getProperty('UPI_NAME') || 'Vimusement';
  if (!vpa) throw new Error('UPI not configured (UPI_VPA)');
  return { vpa: vpa, payeeName: pn,
    upiUri: 'upi://pay?pa=' + vpa + '&pn=' + encodeURIComponent(pn) + '&am=' + amount + '&cu=INR&tn=' + encodeURIComponent(ref) };
}

function _validEmail(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '')); }

function _mail(to, subject, body) {
  if (!_validEmail(to)) return false;
  var opts = { name: PROPS.getProperty('FROM_NAME') || 'Vimusement' };
  var rt = PROPS.getProperty('REPLY_TO'); if (rt) opts.replyTo = rt;
  MailApp.sendEmail(to, subject, body, opts);
  return true;
}

/* ============================================================
   STAFF ACCESS  — username + PIN, from the Staff tab
   (or a STAFF_JSON script property if you'd rather keep it there).
   Every counter action is done under a logged-in staff token so
   the sheet + the _Log tab always record who and when.
   ============================================================ */
function _staffList() {
  var j = PROPS.getProperty('STAFF_JSON');
  if (j) {
    try {
      return JSON.parse(j).map(function (s) {
        return { user: String(s.user || '').trim().toLowerCase(), name: s.name || s.user,
                 role: String(s.role || 'counter').toLowerCase(), active: s.active !== false };
      }).filter(function (s) { return s.user; });
    } catch (e) { /* fall through to the sheet */ }
  }
  var sh = _tab(T_STAFF, STAFF_HEADER);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, STAFF_HEADER.length).getValues().map(function (r) {
    return { user: String(r[0] || '').trim().toLowerCase(), name: String(r[1] || r[0]),
             role: String(r[2] || 'counter').trim().toLowerCase(),
             active: String(r[3]).trim().toLowerCase() !== 'no' && String(r[3]).trim() !== '' };
  }).filter(function (s) { return s.user; });
}

function _log(user, action, detail) {
  try { _tab(T_LOG, LOG_HEADER).appendRow([new Date(), user || '', action || '', detail || '']); } catch (e) {}
}

function staffLogin(p) {
  var user = String(p.user || '').trim().toLowerCase();
  var k = String(p.k || '');
  var deskKey = PROPS.getProperty('COUNTER_KEY');
  if (!user) return { error: 'Enter your username' };
  if (!deskKey || k !== deskKey) return { error: 'Desk key not recognised' };
  var s = _staffList().filter(function (x) { return x.user === user; })[0];
  if (!s || !s.active) return { error: 'That username isn’t on the staff list' };
  var token = Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify({ user: user, name: s.name, role: s.role }), 28800); // 8h
  _log(user, 'login', 'role ' + s.role);
  return { ok: true, name: s.name, user: user, role: s.role, token: token };
}

function staffLogout(p) {
  var s = _sess(p.token);
  CacheService.getScriptCache().remove('sess_' + String(p.token || ''));
  if (s) _log(s.user, 'logout', '');
  return { ok: true };
}

function _sess(token) {
  if (!token) return null;
  var v = CacheService.getScriptCache().get('sess_' + String(token));
  try { return v ? JSON.parse(v) : null; } catch (e) { return null; }
}

/** authorise a counter/admin action. Accepts a staff token, or the
    ADMIN_KEY for admin actions. Returns { user, name, role }. */
function _auth(p, needAdmin) {
  var s = _sess(p.token);
  if (s) {
    if (needAdmin && s.role !== 'admin') throw new Error('admin only');
    return s;
  }
  if (needAdmin && PROPS.getProperty('ADMIN_KEY') && String(p.k) === PROPS.getProperty('ADMIN_KEY')) {
    return { user: 'admin-key', name: 'Admin (key)', role: 'admin' };
  }
  throw new Error('not authorised — log in again');
}

/* ============================================================
   DONATIONS
   ============================================================ */
function pledge(p) {
  var rupees = Math.round(Number(p.amount) || 0);
  var min = Number(PROPS.getProperty('MIN_AMOUNT') || 10);
  var max = Number(PROPS.getProperty('MAX_AMOUNT') || 200000);
  if (!(rupees >= min && rupees <= max)) return { error: 'Amount must be between ' + min + ' and ' + max };

  var name = String(p.name || '').trim().slice(0, 80);
  var email = String(p.email || '').trim().slice(0, 120);
  if (!name) return { error: 'Please add your name' };
  if (!_validEmail(email)) return { error: 'Please add a valid email so we can confirm your gift' };
  var wall = String(p.wall) === 'no' ? 'No' : 'Yes';

  var ref = _newRef();
  var u = _upiUri(rupees, ref);
  _donations().appendRow([new Date(), ref, name, email, rupees, 'UPI', '', '', 'Pending', wall, '', '']);
  return { ref: ref, amount: rupees, vpa: u.vpa, payeeName: u.payeeName, upiUri: u.upiUri };
}

/** donor / buyer says "I've paid" — mark every row with that reference "Paid?".
    Works for both the Donations and LuckyDraw tabs. */
function iPaid(p) {
  var ref = String(p.ref || '').trim().toUpperCase();
  if (!ref) return { error: 'missing reference' };
  var utr = String(p.utr || '').replace(/\D/g, '').slice(0, 20);
  var hit = _markPaid(_donations(), DC.REF, DC.STATUS, DC.UTR, ref, utr);
  hit = _markPaid(_luckydraw(), LC.REF, LC.STATUS, LC.UTR, ref, utr) || hit;
  return hit ? { ok: true } : { error: 'reference not found' };
}
/** staff: "I can see this UPI reference landed in the bank app" — confirm the
    matching Pending / Paid? donation or ticket-reference. The buyer must have
    entered the same reference on "I've paid". Every use is logged. */
function confirmByUtr(p) {
  var st = _auth(p);
  var key = String(p.utr || '').replace(/\D/g, '').slice(-12);
  if (key.length < 10) return { error: 'Enter the 12-digit UPI reference' };
  var out = [];

  var don = _donations(), dl = don.getLastRow();
  if (dl > 1) {
    var dv = don.getRange(2, 1, dl - 1, DON_HEADER.length).getValues();
    for (var i = 0; i < dv.length; i++) {
      var s = String(dv[i][DC.STATUS - 1]).trim();
      if ((s === 'Pending' || s === 'Paid?') &&
          String(dv[i][DC.UTR - 1]).replace(/\D/g, '').slice(-12) === key) {
        don.getRange(i + 2, DC.STATUS).setValue('Confirmed');
        out.push('Donation ' + dv[i][DC.REF - 1] + ' (₹' + dv[i][DC.AMOUNT - 1] + ')');
      }
    }
  }

  var ld = _luckydraw(), ll = ld.getLastRow();
  if (ll > 1) {
    var lv = ld.getRange(2, 1, ll - 1, LD_HEADER.length).getValues();
    var refs = {};
    for (var j = 0; j < lv.length; j++) {
      var ls = String(lv[j][LC.STATUS - 1]).trim();
      if ((ls === 'Pending' || ls === 'Paid?') &&
          String(lv[j][LC.UTR - 1]).replace(/\D/g, '').slice(-12) === key) refs[lv[j][LC.REF - 1]] = 1;
    }
    Object.keys(refs).forEach(function (rf) {
      var n = 0, amt = 0;
      for (var k = 0; k < lv.length; k++) {
        if (String(lv[k][LC.REF - 1]) !== rf) continue;
        if (String(lv[k][LC.STATUS - 1]).trim() === 'Cancelled') continue;
        ld.getRange(k + 2, LC.STATUS).setValue('Confirmed');
        n++; amt += Number(lv[k][LC.PRICE - 1]) || 0;
      }
      out.push(n + ' ticket' + (n === 1 ? '' : 's') + ' ' + rf + ' (₹' + amt + ')');
    });
  }

  if (!out.length) return { error: 'No pending payment found with that reference' };
  _log(st.user, 'confirm by UTR', key + ' → ' + out.join('; '));
  processConfirmations(); processLuckyDraw();
  return { ok: true, confirmed: out };
}

function _markPaid(sh, refCol, statusCol, utrCol, ref, utr) {
  var last = sh.getLastRow();
  if (last < 2) return false;
  var refs = sh.getRange(2, refCol, last - 1, 1).getValues();
  var hit = false;
  for (var i = 0; i < refs.length; i++) {
    if (String(refs[i][0]).toUpperCase() === ref) {
      var row = i + 2, st = String(sh.getRange(row, statusCol).getValue());
      if (st !== 'Confirmed' && st !== 'Cancelled') sh.getRange(row, statusCol).setValue('Paid?');
      if (utrCol && utr) sh.getRange(row, utrCol).setValue(utr);
      hit = true;
    }
  }
  return hit;
}

/** counter: cash donation — recorded as Confirmed straight away */
function donateCash(p) {
  var st = _auth(p);
  var rupees = Math.round(Number(p.amount) || 0);
  if (!(rupees >= 1 && rupees <= 500000)) return { error: 'amount 1–500000' };
  var name = String(p.name || 'Counter donor').trim().slice(0, 80);
  var email = String(p.email || '').trim().slice(0, 120);
  var wall = String(p.wall) === 'no' ? 'No' : 'Yes';
  var ref = _newRef();
  var now = new Date();
  _donations().appendRow([now, ref, name, email, rupees, 'Cash', st.user, '', 'Confirmed', wall, now, '']);
  _log(st.user, 'cash donation', '₹' + rupees + ' ' + ref);
  if (_validEmail(email)) {
    _mail(email, 'Your gift to Vimusement is confirmed 💛',
      'Dear ' + name.split(' ')[0] + ',\n\nWe\'ve received your gift of ₹' + rupees.toLocaleString('en-IN') +
      ' at the Vimusement counter. Reference: ' + ref + '.\n\nThank you for standing with the cause.\n\n— ' +
      (PROPS.getProperty('FROM_NAME') || 'Vimusement') + ' committee');
  }
  return { ok: true, ref: ref, amount: rupees };
}

function getDonors() {
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return { donors: [], count: 0 };
  var rows = sh.getRange(2, 1, last - 1, DON_HEADER.length).getValues();
  var names = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[DC.STATUS - 1]).trim() === 'Confirmed' && String(r[DC.WALL - 1]).trim().toLowerCase() === 'yes') {
      var n = String(r[DC.NAME - 1] || '').trim();
      if (n) names.push(n);
    }
  }
  names.reverse();
  var limit = Number(PROPS.getProperty('DONOR_WALL_LIMIT') || 400);
  return { donors: names.slice(0, limit), count: names.length };
}

function getStats() {
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return { total: 0, count: 0 };
  var rows = sh.getRange(2, 1, last - 1, DON_HEADER.length).getValues();
  var total = 0, count = 0;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][DC.STATUS - 1]).trim() === 'Confirmed') { total += Number(rows[i][DC.AMOUNT - 1]) || 0; count++; }
  }
  return { total: total, count: count };
}

/* ============================================================
   LUCKY DRAW  — one row per ticket
   ============================================================ */
function _ldPrice() { return Number(PROPS.getProperty('LD_PRICE') || 50); }

function drawInfo() {
  return { price: _ldPrice(), maxOnline: Number(PROPS.getProperty('LD_MAX') || 25) };
}

/** online: create N Pending ticket rows sharing one Reference, return the UPI link */
function drawPledge(p) {
  var qty = Math.round(Number(p.qty) || 0);
  var maxQ = Number(PROPS.getProperty('LD_MAX') || 25);
  if (!(qty >= 1 && qty <= maxQ)) return { error: 'Choose between 1 and ' + maxQ + ' tickets' };
  var name = String(p.name || '').trim().slice(0, 80);
  var email = String(p.email || '').trim().slice(0, 120);
  var phone = String(p.phone || '').replace(/[^\d+]/g, '').slice(0, 15);
  if (!name) return { error: 'Please add your name' };
  if (!_validEmail(email)) return { error: 'Please add a valid email — your tickets are sent there' };
  if (phone.replace(/\D/g, '').length < 10) return { error: 'Please add a valid phone number' };

  var price = _ldPrice();
  var amount = qty * price;
  var ref = _newRef();
  var u = _upiUri(amount, ref);
  var sh = _luckydraw();
  var now = new Date();
  var rows = [];
  for (var i = 0; i < qty; i++) rows.push([now, '', ref, name, email, phone, price, 'UPI', '', 'Pending', '', '', '', '']);
  sh.getRange(sh.getLastRow() + 1, 1, qty, LD_HEADER.length).setValues(rows);
  return { ref: ref, qty: qty, amount: amount, vpa: u.vpa, payeeName: u.payeeName, upiUri: u.upiUri };
}

/** counter: cash sale — issue the tickets immediately */
function drawIssueCash(p) {
  var st = _auth(p);
  var qty = Math.round(Number(p.qty) || 0);
  if (!(qty >= 1 && qty <= 100)) return { error: 'qty 1–100' };
  var name = String(p.name || '').trim().slice(0, 80);
  var email = String(p.email || '').trim().slice(0, 120);
  var phone = String(p.phone || '').replace(/[^\d+]/g, '').slice(0, 15);
  if (!name) return { error: 'Enter the buyer name' };
  if (phone.replace(/\D/g, '').length < 10) return { error: 'Enter the buyer phone number' };
  var price = _ldPrice();

  var sh = _luckydraw();
  var now = new Date();
  var ref = _newRef();
  var ids = [], rows = [];
  for (var i = 0; i < qty; i++) {
    var id = _nextId('LD');
    ids.push(id);
    rows.push([now, id, ref, name, email, phone, price, 'Cash', st.user, 'Confirmed', now, '', '', '']);
  }
  sh.getRange(sh.getLastRow() + 1, 1, qty, LD_HEADER.length).setValues(rows);
  _log(st.user, 'cash tickets', 'x' + qty + ' ' + ref + ' ₹' + (qty * price) + ' → ' + ids.join(','));

  if (_validEmail(email)) _mailTickets(email, name, ids);
  return { ref: ref, qty: qty, amount: qty * price, ids: ids };
}

function _mailTickets(email, name, ids) {
  if (!_validEmail(email)) return;
  var fromName = PROPS.getProperty('FROM_NAME') || 'Vimusement';
  var replyTo = PROPS.getProperty('REPLY_TO') || '';
  var plural = ids.length > 1;
  var first = String(name || 'Friend').split(' ')[0];

  var chips = ids.map(function (id) {
    return '<span style="display:inline-block;margin:4px;padding:8px 14px;border:1px solid #d8c7a6;' +
      'border-radius:8px;background:#fff;font-family:Courier New,monospace;font-size:16px;' +
      'font-weight:bold;color:#201b2b">' + _esc(id) + '</span>';
  }).join('');

  var html =
    '<div style="font-family:Helvetica,Arial,sans-serif;color:#201b2b;max-width:520px;margin:0 auto">' +
      '<p style="letter-spacing:2px;color:#5a43c9;font-weight:bold;font-size:13px;margin:0 0 4px">VIMUSEMENT ' +
        new Date().getFullYear() + ' &mdash; LUCKY DRAW</p>' +
      '<h2 style="margin:0 0 12px;font-size:22px">You\'re in the hat, ' + _esc(first) + '.</h2>' +
      '<p style="color:#4c4557;line-height:1.55">Here ' + (plural ? 'are your ticket numbers' : 'is your ticket number') +
        ' &mdash; the ' + (plural ? 'designed tickets are' : 'designed ticket is') +
        ' attached as a PDF you can save or print:</p>' +
      '<p style="text-align:center;margin:16px 0">' + chips + '</p>' +
      '<p style="color:#4c4557;line-height:1.55">If one of these is drawn <b>live on stage</b> on the night, that\'s you &mdash; ' +
        'winners are also contacted directly. Thank you for backing the cause.</p>' +
      '<p style="color:#877e92;font-size:13px;margin-top:20px">&mdash; ' + _esc(fromName) + ' committee</p>' +
    '</div>';

  var opts = { htmlBody: html, name: fromName };
  if (replyTo) opts.replyTo = replyTo;
  try {
    var pdf = Utilities.newBlob(_ticketHtml(name, ids), 'text/html', 't.html')
      .getAs('application/pdf').setName('Vimusement lucky-draw ticket' + (plural ? 's' : '') + '.pdf');
    opts.attachments = [pdf];
  } catch (err) { /* PDF renderer unavailable — send without the attachment */ }

  MailApp.sendEmail(email, 'Your Vimusement lucky-draw ticket' + (plural ? 's' : ''),
    'Your ticket number' + (plural ? 's' : '') + ': ' + ids.join(', ') + '\n(open this email in a browser to see the designed ticket)', opts);
}

/** the designed ticket(s), one per PDF page. Email-safe fonts only. */
function _ticketHtml(name, ids) {
  var yr = new Date().getFullYear();
  var pages = ids.map(function (id) {
    return '<div class="tk">' +
      '<div class="tk__main">' +
        '<div class="tk__brand">VIMUSEMENT ' + yr + '</div>' +
        '<div class="tk__kind">LUCKY&nbsp;DRAW&nbsp;TICKET</div>' +
        '<div class="tk__holder">' + _esc(name) + '</div>' +
        '<div class="tk__note">Drawn live on stage on the night &middot; Ascension Church, Aminjikkarai</div>' +
      '</div>' +
      '<div class="tk__stub">' +
        '<div class="tk__stub-label">TICKET&nbsp;N&ordm;</div>' +
        '<div class="tk__stub-no">' + _esc(id) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    '@page{size:190mm 78mm;margin:0}' +
    'html,body{margin:0;padding:0}' +
    '.tk{width:190mm;height:78mm;box-sizing:border-box;display:table;table-layout:fixed;' +
      'page-break-after:always;background:#fbf6ef;color:#201b2b;' +
      'font-family:Helvetica,Arial,sans-serif;border:3px solid #201b2b;position:relative}' +
    '.tk__main{display:table-cell;vertical-align:top;padding:14mm 12mm;width:130mm;position:relative}' +
    '.tk__stub{display:table-cell;vertical-align:middle;text-align:center;width:57mm;' +
      'border-left:2px dashed #7a2c8d;background:#f3eadd;padding:6mm}' +
    '.tk__brand{font-size:12pt;letter-spacing:4pt;color:#5a43c9;font-weight:bold}' +
    '.tk__kind{font-size:8.5pt;letter-spacing:3pt;color:#877e92;margin-top:3mm}' +
    '.tk__holder{font-size:24pt;font-weight:bold;margin-top:12mm;color:#201b2b}' +
    '.tk__note{font-size:8pt;color:#877e92;position:absolute;left:12mm;bottom:12mm}' +
    '.tk__stub-label{font-size:7.5pt;letter-spacing:3pt;color:#877e92}' +
    '.tk__stub-no{font-size:17pt;font-weight:bold;font-family:Courier New,monospace;' +
      'margin-top:4mm;color:#201b2b}' +
    '</style></head><body>' + pages + '</body></html>';
}

function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/** the on-stage picker reads this: every ticket currently in the pool */
function drawPool(p) {
  _auth(p, true);
  var sh = _luckydraw();
  var last = sh.getLastRow();
  if (last < 2) return { pool: [] };
  var rows = sh.getRange(2, 1, last - 1, LD_HEADER.length).getValues();
  var pool = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[LC.STATUS - 1]).trim() === 'Confirmed' && r[LC.TID - 1] && !r[LC.WON - 1]) {
      pool.push({ id: String(r[LC.TID - 1]), name: String(r[LC.NAME - 1] || '').split(' ')[0] });
    }
  }
  return { pool: pool, count: pool.length };
}

/** the picker calls this after a winner lands */
function drawRecordWinner(p) {
  var st = _auth(p, true);
  var id = String(p.id || '').trim().toUpperCase();
  var prize = String(p.prize || 'Prize').trim().slice(0, 60);
  if (!id) return { error: 'missing id' };
  var sh = _luckydraw();
  var last = sh.getLastRow();
  var tids = sh.getRange(2, LC.TID, last - 1, 1).getValues();
  for (var i = 0; i < tids.length; i++) {
    if (String(tids[i][0]).toUpperCase() === id) {
      var row = i + 2;
      sh.getRange(row, LC.WON).setValue(prize);
      var name = String(sh.getRange(row, LC.NAME).getValue());
      var email = String(sh.getRange(row, LC.EMAIL).getValue());
      if (_validEmail(email)) {
        _mail(email, 'You won at the Vimusement lucky draw! 🎉',
          'Dear ' + name.split(' ')[0] + ',\n\nTicket ' + id + ' has won the ' + prize +
          ' in the Vimusement lucky draw. Congratulations!\n\nSomeone from the committee will be in touch about collecting your prize.\n\n— ' +
          (PROPS.getProperty('FROM_NAME') || 'Vimusement') + ' committee');
      }
      _log(st.user, 'winner', prize + ' → ' + id + ' (' + name + ')');
      return { ok: true, name: name.split(' ')[0], prize: prize };
    }
  }
  return { error: 'ticket not found' };
}

function drawStats() {
  var sh = _luckydraw();
  var last = sh.getLastRow();
  if (last < 2) return { sold: 0, amount: 0, pool: 0 };
  var rows = sh.getRange(2, 1, last - 1, LD_HEADER.length).getValues();
  var sold = 0, amount = 0, pool = 0;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][LC.STATUS - 1]).trim() === 'Confirmed') {
      sold++; amount += Number(rows[i][LC.PRICE - 1]) || 0;
      if (rows[i][LC.TID - 1] && !rows[i][LC.WON - 1]) pool++;
    }
  }
  return { sold: sold, amount: amount, pool: pool };
}

/* ============================================================
   CONFIRM + NOTIFY  (donations AND lucky-draw UPI purchases)
   ============================================================ */
function onSheetEdit(e) {
  try {
    if (!e || !e.range) return;
    var name = e.range.getSheet().getName();
    if (name === T_DON && e.range.getColumn() === DC.STATUS) processConfirmations();
    if (name === T_LD && e.range.getColumn() === LC.STATUS) processLuckyDraw();
  } catch (err) { /* never block the edit */ }
}

function processConfirmations() {
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var data = sh.getRange(2, 1, last - 1, DON_HEADER.length).getValues();
  var n = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[DC.STATUS - 1]).trim() === 'Confirmed' && !r[DC.CONFIRMED - 1]) {
      var row = i + 2;
      sh.getRange(row, DC.CONFIRMED).setValue(new Date());
      var first = String(r[DC.NAME - 1] || 'Friend').split(' ')[0];
      var amt = '₹' + Number(r[DC.AMOUNT - 1] || 0).toLocaleString('en-IN');
      _mail(r[DC.EMAIL - 1], 'Your gift to Vimusement is confirmed 💛',
        'Dear ' + first + ',\n\nWe\'ve received and confirmed your gift of ' + amt + ' to Vimusement.\n' +
        'Reference: ' + r[DC.REF - 1] + '\n\nEvery rupee, after event costs, goes to scholarships, our ' +
        'medical-emergency fund, and help for neighbours in need — a full account is published after the event.\n\n' +
        'Thank you for standing with the cause.\n\n— ' + (PROPS.getProperty('FROM_NAME') || 'Vimusement') + ' committee');
      n++;
    }
  }
  return n;
}

/**
 * When ANY ticket row of a Reference is set to Confirmed, confirm the whole
 * Reference, issue Ticket IDs for its rows, and email the buyer once.
 */
function processLuckyDraw() {
  var sh = _luckydraw();
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var data = sh.getRange(2, 1, last - 1, LD_HEADER.length).getValues();

  // references that have at least one Confirmed row
  var refsToFinish = {};
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][LC.STATUS - 1]).trim() === 'Confirmed') refsToFinish[data[i][LC.REF - 1]] = true;
  }

  var issued = 0;
  Object.keys(refsToFinish).forEach(function (ref) {
    var rowsForRef = [], anyPending = false, email = '', name = '';
    for (var j = 0; j < data.length; j++) {
      if (String(data[j][LC.REF - 1]) !== String(ref)) continue;
      rowsForRef.push(j + 2);
      email = data[j][LC.EMAIL - 1]; name = data[j][LC.NAME - 1];
    }
    // 1. confirm + issue IDs for every row of this reference
    rowsForRef.forEach(function (row) {
      var st = String(sh.getRange(row, LC.STATUS).getValue()).trim();
      if (st === 'Cancelled') return;
      if (st !== 'Confirmed') sh.getRange(row, LC.STATUS).setValue('Confirmed');
      if (!sh.getRange(row, LC.TID).getValue()) {
        sh.getRange(row, LC.TID).setValue(_nextId('LD'));
        sh.getRange(row, LC.CONFIRMED).setValue(new Date());
        issued++;
      }
    });
    // 2. email the buyer once (marker in the Notes cell of the first row)
    var firstRow = rowsForRef[0];
    var notes = String(sh.getRange(firstRow, LC.NOTES).getValue());
    if (notes.indexOf('emailed') === -1 && _validEmail(email)) {
      var ids = [];
      rowsForRef.forEach(function (row) {
        var t = sh.getRange(row, LC.TID).getValue();
        if (t && !String(sh.getRange(row, LC.STATUS).getValue()).match(/cancelled/i)) ids.push(String(t));
      });
      if (ids.length) {
        _mailTickets(email, name, ids);
        sh.getRange(firstRow, LC.NOTES).setValue((notes ? notes + ' · ' : '') + 'emailed ' + new Date().toLocaleString());
      }
    }
  });
  return issued;
}

/* ============================================================
   HOUSEKEEPING  (every 15 min)
   ============================================================ */
function houseKeeping() {
  processConfirmations();
  processLuckyDraw();
  cleanupStale(_donations(), DC.STATUS, DC.TS);
  cleanupStale(_luckydraw(), LC.STATUS, LC.TS);
  if (PROPS.getProperty('ENABLE_EMAIL_RECONCILE') === 'yes') reconcileFromEmail();
}

function cleanupStale(sh, statusCol, tsCol) {
  var last = sh.getLastRow();
  if (last < 2) return;
  var cutoff = Date.now() - 48 * 3600 * 1000;
  var rows = sh.getRange(2, 1, last - 1, Math.max(statusCol, tsCol)).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][statusCol - 1]).trim() === 'Pending') {
      var ts = new Date(rows[i][tsCol - 1]).getTime();
      if (ts && ts < cutoff) sh.getRange(i + 2, statusCol).setValue('Cancelled');
    }
  }
}

/* ============================================================
   AUTO-RECONCILE from forwarded bank-alert emails
   Matches an incoming payment to a Pending / Paid? row by the
   buyer-entered UTR (12-digit UPI reference) AND the amount.
   One UTR confirms one payment. Anything it can't match is left
   for a human to check against the bank statement.

   Script properties:
     ENABLE_EMAIL_RECONCILE = yes
     RECONCILE_LABEL        = vim-bank-alerts        (the Gmail label)
     BANK_SENDER            = alerts@icicibank.com   (only trust this sender;
                               comma-separate for more than one)
   ============================================================ */
function reconcileFromEmail() {
  if (PROPS.getProperty('ENABLE_EMAIL_RECONCILE') !== 'yes') return 0;
  var label  = PROPS.getProperty('RECONCILE_LABEL') || 'vim-bank-alerts';
  var sender = String(PROPS.getProperty('BANK_SENDER') || '').trim();

  var q = 'label:' + label + ' is:unread newer_than:5d';
  if (sender) q += ' (' + sender.split(',').map(function (s) { return 'from:' + s.trim(); }).join(' OR ') + ')';
  var threads = GmailApp.search(q, 0, 50);
  if (!threads.length) return 0;

  var don = _donations(), ld = _luckydraw();
  var dRows = don.getLastRow() > 1 ? don.getRange(2, 1, don.getLastRow() - 1, DON_HEADER.length).getValues() : [];
  var lRows = ld.getLastRow()  > 1 ? ld.getRange(2, 1, ld.getLastRow()  - 1, LD_HEADER.length).getValues()  : [];

  var used = {};   // UTRs already tied to a Confirmed row
  dRows.forEach(function (r) { var u = _utrKey(r[DC.UTR - 1]); if (u && String(r[DC.STATUS - 1]).trim() === 'Confirmed') used[u] = 1; });
  lRows.forEach(function (r) { var u = _utrKey(r[LC.UTR - 1]); if (u && String(r[LC.STATUS - 1]).trim() === 'Confirmed') used[u] = 1; });

  var done = 0;
  threads.forEach(function (t) {
    t.getMessages().forEach(function (m) {
      if (!m.isUnread()) return;
      var body = (m.getPlainBody() || '').replace(/ /g, ' ');
      var utr = _utrKey(_extractUtr(body));
      var amt = _extractAmount(body);
      if (!utr || used[utr]) return;
      var matched = false;

      // ---- donations ----
      for (var i = 0; i < dRows.length && !matched; i++) {
        var dst = String(dRows[i][DC.STATUS - 1]).trim();
        if (dst !== 'Pending' && dst !== 'Paid?') continue;
        if (_utrKey(dRows[i][DC.UTR - 1]) !== utr) continue;
        if (amt && Math.round(Number(dRows[i][DC.AMOUNT - 1])) !== amt) continue;
        don.getRange(i + 2, DC.STATUS).setValue('Confirmed');
        don.getRange(i + 2, DC.NOTES).setValue('auto ' + Utilities.formatDate(m.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
        dRows[i][DC.STATUS - 1] = 'Confirmed'; matched = true;
      }

      // ---- lucky draw: confirm the whole reference ----
      for (var j = 0; j < lRows.length && !matched; j++) {
        var lst = String(lRows[j][LC.STATUS - 1]).trim();
        if (lst !== 'Pending' && lst !== 'Paid?') continue;
        if (_utrKey(lRows[j][LC.UTR - 1]) !== utr) continue;
        var refv = String(lRows[j][LC.REF - 1]);
        var sum = 0;
        for (var k = 0; k < lRows.length; k++) if (String(lRows[k][LC.REF - 1]) === refv) sum += Number(lRows[k][LC.PRICE - 1]) || 0;
        if (amt && sum !== amt) continue;
        for (var k2 = 0; k2 < lRows.length; k2++) {
          if (String(lRows[k2][LC.REF - 1]) !== refv) continue;
          if (String(lRows[k2][LC.STATUS - 1]).trim() === 'Cancelled') continue;
          ld.getRange(k2 + 2, LC.STATUS).setValue('Confirmed');
          lRows[k2][LC.STATUS - 1] = 'Confirmed';
        }
        matched = true;
      }

      if (matched) {
        used[utr] = 1; done++;
        m.markRead();
        _log('reconcile', 'auto-confirm', 'UTR ' + utr + ' · ₹' + (amt || '?'));
      }
    });
  });

  if (done) { processConfirmations(); processLuckyDraw(); }
  return done;
}

function _utrKey(v) {
  var s = String(v || '').replace(/\D/g, '');
  return s.length >= 10 ? s.slice(-12) : '';
}
function _extractUtr(body) {
  var m = body.match(/(?:UPI(?:[\s\-]*(?:Ref(?:erence)?|transaction))?[\s\-]*(?:No\.?|ID|Id)?|UTR|RRN)\s*[:#\-]?\s*([0-9]{12})\b/i);
  if (m) return m[1];
  m = body.match(/\b([0-9]{12})\b/);          // fall back to any bare 12-digit number
  return m ? m[1] : '';
}
function _extractAmount(body) {
  var m = body.replace(/,/g, '').match(/(?:INR|Rs\.?|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
  return m ? Math.round(parseFloat(m[1])) : null;
}

/* ============================================================
   MENU + SELF TEST
   ============================================================ */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Vimusement')
    .addItem('Confirm selected rows (this tab)', 'confirmSelectedRows')
    .addItem('Run confirmations + emails now', 'runAllConfirmations')
    .addToUi();
}
function runAllConfirmations() {
  var n = processConfirmations() + processLuckyDraw();
  SpreadsheetApp.getActive().toast('Processed ' + n + ' updates.');
}
function confirmSelectedRows() {
  var sh = SpreadsheetApp.getActiveSheet();
  var name = sh.getName();
  var statusCol = name === T_DON ? DC.STATUS : (name === T_LD ? LC.STATUS : 0);
  if (!statusCol) { SpreadsheetApp.getActive().toast('Open the Donations or LuckyDraw tab first.'); return; }
  var rows = {};
  sh.getActiveRangeList().getRanges().forEach(function (rg) {
    for (var r = rg.getRow(); r < rg.getRow() + rg.getNumRows(); r++) if (r >= 2) rows[r] = true;
  });
  Object.keys(rows).forEach(function (r) { sh.getRange(Number(r), statusCol).setValue('Confirmed'); });
  runAllConfirmations();
}

function _selfTest() {
  Logger.log('Donations tab: rows=' + _donations().getLastRow());
  Logger.log('LuckyDraw tab: rows=' + _luckydraw().getLastRow());
  var stf = _tab(T_STAFF, STAFF_HEADER);
  if (stf.getLastRow() < 2) {
    stf.appendRow(['roonah', 'Roonah', 'admin', 'Yes', 'add a row per counter volunteer (role = counter). Active = No locks them out.']);
    Logger.log('Staff tab seeded with admin "roonah" — add your counter volunteers as rows.');
  }
  _tab(T_LOG, LOG_HEADER);   // hidden audit log
  Logger.log('Staff rows: ' + (stf.getLastRow() - 1) + ' · UPI_VPA set: ' + !!PROPS.getProperty('UPI_VPA') +
    ' · ADMIN_KEY set: ' + !!PROPS.getProperty('ADMIN_KEY'));
  Logger.log('drawInfo: ' + JSON.stringify(drawInfo()));
}
