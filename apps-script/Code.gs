/**
 * ============================================================
 * VIMUSEMENT — backend  (Google Apps Script, bound to the Master sheet)
 * ============================================================
 * ONE script for the whole project. One tab per feature:
 *     Donations   ← this file        (zero-fee UPI + confirm + notify)
 *     Movies      ← added later
 *     Food        ← added later
 *
 * DONATIONS use plain UPI (zero MDR — no gateway, no fee):
 *   1. site  ?action=pledge   → we write a "Pending" row + a reference,
 *                               and return a upi://pay link for that amount
 *   2. donor pays in their UPI app (GPay / PhonePe / Paytm / BHIM …)
 *   3. site  ?action=ipaid    → row → "Paid?" (+ the donor's UPI ref if given)
 *   4. a volunteer checks the bank statement and sets Status = "Confirmed"
 *   5. the script emails the donor "your gift is confirmed" AND the name
 *      then appears on the public supporters wall (?action=donors)
 *
 * Optional phase-2: auto-confirm from forwarded bank-alert emails
 *   (reconcileFromEmail — off unless ENABLE_EMAIL_RECONCILE = "yes").
 *
 * ---- Deploy ----
 *   Deploy ▸ New deployment ▸ Web app · Execute as: Me · Access: Anyone
 *   Put the /exec URL in  years/2026.config.js → donation.api
 *
 * ---- Script properties (Project Settings ▸ Script properties) ----
 *   UPI_VPA            the parish UPI id, e.g. ascension@okhdfcbank   (REQUIRED)
 *   UPI_NAME           payee name shown in the UPI app               (REQUIRED)
 *   FROM_NAME          e.g. "Vimusement"                             (optional)
 *   REPLY_TO           committee email for replies                   (optional)
 *   MIN_AMOUNT         rupees, default 10
 *   MAX_AMOUNT         rupees, default 200000
 *   DONOR_WALL_LIMIT   names returned to the site, default 400
 *   ENABLE_EMAIL_RECONCILE   "yes" to turn on phase-2 (see bottom)
 *   RECONCILE_LABEL    Gmail label with forwarded bank alerts, default "bank-alerts"
 *
 * ---- One-time triggers to add (Triggers ▸ Add trigger) ----
 *   onDonationEdit   — event source: From spreadsheet, type: On edit
 *   houseKeeping     — time-driven, every 15 minutes
 * ============================================================
 */

var PROPS = PropertiesService.getScriptProperties();
var DONATIONS_TAB = 'Donations';
var DON_HEADER = [
  'Timestamp', 'Reference', 'Name', 'Email', 'Amount (INR)',
  'Donor UPI ref', 'Status', 'Show on wall', 'Confirmed at', 'Notes'
];
var STATUS_LIST = ['Pending', 'Paid?', 'Confirmed', 'Cancelled'];
var COL = { TS: 1, REF: 2, NAME: 3, EMAIL: 4, AMOUNT: 5, UTR: 6, STATUS: 7, WALL: 8, CONFIRMED: 9, NOTES: 10 };

/* ============================================================
   WEB APP ROUTER
   ============================================================ */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'donors';
  try {
    switch (action) {
      case 'ping':    return _json({ ok: true, time: new Date().toISOString() });
      case 'pledge':  return _json(pledge(e.parameter));
      case 'ipaid':   return _json(iPaid(e.parameter));
      case 'donors':  return _json(getDonors());
      case 'stats':   return _json(getStats());
      default:        return _json({ error: 'unknown action: ' + action });
    }
  } catch (err) {
    return _json({ error: String((err && err.message) || err) });
  }
}
function doPost(e) { return doGet(e); }

function _json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   SHEET
   ============================================================ */
function _ss() {
  var id = PROPS.getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function _donations() {
  var ss = _ss();
  var sh = ss.getSheetByName(DONATIONS_TAB);
  if (!sh) sh = ss.insertSheet(DONATIONS_TAB);

  // make sure row 1 is exactly the current header — repairs a tab left over
  // from an earlier layout (otherwise data lands under the wrong labels).
  var head = sh.getRange(1, 1, 1, DON_HEADER.length).getValues()[0];
  var ok = DON_HEADER.every(function (h, i) { return String(head[i]) === h; });
  if (!ok) {
    sh.getRange(1, 1, 1, DON_HEADER.length).setValues([DON_HEADER]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }

  // keep a dropdown on the Status column so volunteers just pick a value
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LIST, true).build();
  sh.getRange(2, COL.STATUS, Math.max(sh.getMaxRows() - 1, 1)).setDataValidation(rule);
  return sh;
}

/* ============================================================
   1 · PLEDGE  — create the row + the UPI link
   ============================================================ */
function pledge(p) {
  var rupees = Math.round(Number(p.amount) || 0);
  var min = Number(PROPS.getProperty('MIN_AMOUNT') || 10);
  var max = Number(PROPS.getProperty('MAX_AMOUNT') || 200000);
  if (!(rupees >= min && rupees <= max)) return { error: 'Amount must be between ' + min + ' and ' + max };

  var vpa = PROPS.getProperty('UPI_VPA');
  var payeeName = PROPS.getProperty('UPI_NAME') || 'Vimusement';
  if (!vpa) return { error: 'UPI not configured (UPI_VPA)' };

  var name = String(p.name || '').trim().slice(0, 80);
  var email = String(p.email || '').trim().slice(0, 120);
  if (!name) return { error: 'Please add your name' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Please add a valid email so we can confirm your gift' };
  var wall = String(p.wall) === 'no' ? 'No' : 'Yes';

  var ref = _newRef();
  _donations().appendRow([
    new Date(), ref, name, email, rupees, '', 'Pending', wall, '', ''
  ]);

  // VPA left un-encoded (the "@" must stay literal for many UPI apps);
  // only pn / tn are percent-encoded.
  var upiUri = 'upi://pay?pa=' + vpa
    + '&pn=' + encodeURIComponent(payeeName)
    + '&am=' + rupees
    + '&cu=INR'
    + '&tn=' + encodeURIComponent(ref);

  return { ref: ref, amount: rupees, vpa: vpa, payeeName: payeeName, upiUri: upiUri };
}

function _newRef() {
  var yr = String(new Date().getFullYear()).slice(-2);
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I O 0 1
  var s = '';
  for (var i = 0; i < 5; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'VIM' + yr + '-' + s;   // e.g. VIM26-5ZBA9
}

/* ============================================================
   2 · I PAID  — donor says they've sent the money
   ============================================================ */
function iPaid(p) {
  var ref = String(p.ref || '').trim().toUpperCase();
  if (!ref) return { error: 'missing reference' };
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return { error: 'not found' };
  var refs = sh.getRange(2, COL.REF, last - 1, 1).getValues();
  for (var i = 0; i < refs.length; i++) {
    if (String(refs[i][0]).toUpperCase() === ref) {
      var row = i + 2;
      var status = String(sh.getRange(row, COL.STATUS).getValue());
      if (status === 'Confirmed') return { ok: true, already: true };
      sh.getRange(row, COL.STATUS).setValue('Paid?');
      var utr = String(p.utr || '').trim().slice(0, 40);
      if (utr) sh.getRange(row, COL.UTR).setValue(utr);
      return { ok: true };
    }
  }
  return { error: 'reference not found' };
}

/* ============================================================
   3 · CONFIRM + NOTIFY
   Runs from: the on-edit trigger, the custom menu, and houseKeeping.
   Idempotent — only touches rows that are Confirmed with no "Confirmed at".
   ============================================================ */
function onDonationEdit(e) {
  try {
    if (!e || !e.range) return;
    if (e.range.getSheet().getName() !== DONATIONS_TAB) return;
    if (e.range.getColumn() !== COL.STATUS) return;
    processConfirmations();
  } catch (err) { /* never block the edit */ }
}

function processConfirmations() {
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var data = sh.getRange(2, 1, last - 1, DON_HEADER.length).getValues();
  var sent = 0;
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (String(r[COL.STATUS - 1]).trim() === 'Confirmed' && !r[COL.CONFIRMED - 1]) {
      var row = i + 2;
      sh.getRange(row, COL.CONFIRMED).setValue(new Date());
      _notifyDonor({
        name: r[COL.NAME - 1], email: r[COL.EMAIL - 1],
        amount: r[COL.AMOUNT - 1], ref: r[COL.REF - 1]
      });
      sent++;
    }
  }
  return sent;
}

function _notifyDonor(d) {
  if (!d.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email))) return;
  var fromName = PROPS.getProperty('FROM_NAME') || 'Vimusement';
  var replyTo = PROPS.getProperty('REPLY_TO') || '';
  var first = String(d.name || 'Friend').split(' ')[0];
  var amt = '₹' + Number(d.amount || 0).toLocaleString('en-IN');
  var subject = 'Your gift to Vimusement is confirmed 💛';
  var body =
    'Dear ' + first + ',\n\n' +
    'We\'ve received and confirmed your gift of ' + amt + ' to Vimusement.\n' +
    'Reference: ' + d.ref + '\n\n' +
    'Every rupee, after event costs, goes to scholarships, our medical-emergency fund, ' +
    'and help for neighbours in need — and a full account is published after the event.\n\n' +
    'Thank you for standing with the cause.\n\n' +
    '— ' + fromName + ' committee';
  var opts = { name: fromName };
  if (replyTo) opts.replyTo = replyTo;
  MailApp.sendEmail(d.email, subject, body, opts);
}

/* ============================================================
   4 · PUBLIC READ ENDPOINTS
   ============================================================ */

/** Supporters wall — NAMES ONLY, confirmed gifts only, never amounts. */
function getDonors() {
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return { donors: [], count: 0 };
  var rows = sh.getRange(2, 1, last - 1, DON_HEADER.length).getValues();
  var names = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    // must be Confirmed AND an explicit "Yes" on the wall — a blank never shows a name
    if (String(r[COL.STATUS - 1]).trim() === 'Confirmed' && String(r[COL.WALL - 1]).trim().toLowerCase() === 'yes') {
      var n = String(r[COL.NAME - 1] || '').trim();
      if (n) names.push(n);
    }
  }
  names.reverse();
  var limit = Number(PROPS.getProperty('DONOR_WALL_LIMIT') || 400);
  return { donors: names.slice(0, limit), count: names.length };
}

/** Aggregate total — only surfaced on the site if donation.showTotal is true. */
function getStats() {
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return { total: 0, count: 0 };
  var rows = sh.getRange(2, COL.AMOUNT, last - 1, COL.STATUS - COL.AMOUNT + 1).getValues();
  var total = 0, count = 0;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][rows[i].length - 1]).trim() === 'Confirmed') { total += Number(rows[i][0]) || 0; count++; }
  }
  return { total: total, count: count };
}

/* ============================================================
   HOUSEKEEPING  (time trigger, every 15 min)
   ============================================================ */
function houseKeeping() {
  processConfirmations();
  cleanupStalePledges();
  if (PROPS.getProperty('ENABLE_EMAIL_RECONCILE') === 'yes') reconcileFromEmail();
}

/** Mark still-Pending rows older than 48h as Cancelled (donor never paid). */
function cleanupStalePledges() {
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return;
  var cutoff = Date.now() - 48 * 3600 * 1000;
  var rows = sh.getRange(2, 1, last - 1, DON_HEADER.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][COL.STATUS - 1]).trim() === 'Pending') {
      var ts = new Date(rows[i][COL.TS - 1]).getTime();
      if (ts && ts < cutoff) sh.getRange(i + 2, COL.STATUS).setValue('Cancelled');
    }
  }
}

/* ============================================================
   PHASE 2 (optional) — auto-confirm from forwarded bank alerts
   Turn on with script property  ENABLE_EMAIL_RECONCILE = "yes".
   Forward the parish account's UPI credit alerts to this Gmail and
   label them (default label "bank-alerts"). This reads unread ones,
   pulls the ₹amount, and confirms the oldest matching Pending/Paid? row.
   Fragile — depends on the bank's email wording. Test with real alerts
   before relying on it; the manual path always still works.
   ============================================================ */
function reconcileFromEmail() {
  var label = PROPS.getProperty('RECONCILE_LABEL') || 'bank-alerts';
  var threads = GmailApp.search('label:' + label + ' is:unread newer_than:3d', 0, 30);
  if (!threads.length) return;
  var sh = _donations();
  var last = sh.getLastRow();
  if (last < 2) return;
  var data = sh.getRange(2, 1, last - 1, DON_HEADER.length).getValues();

  threads.forEach(function (t) {
    t.getMessages().forEach(function (m) {
      if (!m.isUnread()) return;
      var text = m.getPlainBody().replace(/[,]/g, '');
      var mAmt = text.match(/(?:INR|Rs\.?|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      var mRef = text.match(/VIM\d{2}-?[A-Z0-9]{5}/i);
      if (!mAmt && !mRef) return;
      var amt = mAmt ? Math.round(parseFloat(mAmt[1])) : null;
      var ref = mRef ? mRef[0].toUpperCase() : null;

      for (var i = 0; i < data.length; i++) {
        var r = data[i], st = String(r[COL.STATUS - 1]).trim();
        if (st !== 'Pending' && st !== 'Paid?') continue;
        var matchRef = ref && String(r[COL.REF - 1]).toUpperCase() === ref;
        var matchAmt = amt && Number(r[COL.AMOUNT - 1]) === amt;
        if (matchRef || matchAmt) {
          sh.getRange(i + 2, COL.STATUS).setValue('Confirmed');
          sh.getRange(i + 2, COL.NOTES).setValue('auto-confirmed from bank alert ' + m.getDate());
          data[i][COL.STATUS - 1] = 'Confirmed';
          break;
        }
      }
      m.markRead();
    });
  });
  processConfirmations();
}

/* ============================================================
   MENU + SELF TEST
   ============================================================ */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Vimusement')
    .addItem('Confirm selected donation rows', 'confirmSelectedRows')
    .addItem('Run confirmations + email now', 'processConfirmations')
    .addToUi();
}

/** Select any cells in the rows you've checked, then run this. */
function confirmSelectedRows() {
  var sh = _donations();
  var sel = sh.getActiveRangeList().getRanges();
  var rows = {};
  sel.forEach(function (rg) {
    for (var r = rg.getRow(); r < rg.getRow() + rg.getNumRows(); r++) if (r >= 2) rows[r] = true;
  });
  Object.keys(rows).forEach(function (r) { sh.getRange(Number(r), COL.STATUS).setValue('Confirmed'); });
  var n = processConfirmations();
  SpreadsheetApp.getActive().toast(n + ' donor(s) confirmed and emailed.');
}

function _selfTest() {
  var sh = _donations();
  Logger.log('Sheet OK: ' + sh.getName() + ' rows=' + sh.getLastRow());
  Logger.log('UPI_VPA set: ' + !!PROPS.getProperty('UPI_VPA'));
  Logger.log('Donors: ' + JSON.stringify(getDonors()));
  Logger.log('Pledge test: ' + JSON.stringify(pledge({ amount: 100, name: 'Self Test', email: 'test@example.com' })));
}
