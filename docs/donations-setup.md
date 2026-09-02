# Donations — setup & verification  (zero-fee UPI)

Donors pay **straight to the parish UPI id** — no payment gateway, **no fees**, 100% of
each gift lands. A volunteer confirms each one against the bank statement; the script then
emails the donor and adds their name to the supporters wall.

---

## What it costs

| Piece | Cost |
|---|---|
| Google Sheet + Apps Script + emails | Free (email quota: 100/day on a normal Gmail, 1,500/day on Workspace) |
| Website + GitHub Pages | Free |
| **UPI transfer to the parish account** | **₹0 — zero MDR by RBI mandate** |

The only "cost" is a few minutes of a volunteer's time to tick off confirmed gifts.

---

## How it works

```
donate.html                    Apps Script (bound to Master sheet)        Parish
──────────                      ──────────────────────────────────         ──────
1. amount + name + email  ─►    ?action=pledge
                                writes a "Pending" row + a reference
                          ◄─    { ref: VIM26ABCDE, upi://pay link }
2. QR + "open UPI app"                                                     UPI id
   donor pays the exact amount  ──────────────────────────────────────►    receives ₹
3. "I've paid" (+ UPI ref) ─►   ?action=ipaid   row → "Paid?"
4. volunteer checks the bank statement, sets Status → "Confirmed"
5. script emails the donor  ◄── on-edit trigger → processConfirmations()
6. name appears on the wall ◄── ?action=donors  (confirmed names only, never amounts)
```

## The Master sheet — tab `Donations`

Auto-created. Columns:

| Col | Header | Filled by |
|-----|--------|-----------|
| A | Timestamp | script (pledge) |
| B | Reference | script — `VIM26xxxxx`, unique, also in the UPI note |
| C | Name | donor |
| D | Email | donor — needed to send the confirmation |
| E | Amount (INR) | donor's choice — **never leaves the sheet** |
| F | Donor UPI ref | donor (optional, via "I've paid") |
| G | **Status** | dropdown: `Pending` → `Paid?` → **`Confirmed`** / `Cancelled` |
| H | Show on wall | `Yes` / `No` (donor's checkbox — edit to hide a name) |
| I | Confirmed at | script — set when you confirm |
| J | Notes | you |

You only ever touch **column G** (and J). Everything else is automatic.

---

## What you provide

| # | Thing | Notes |
|---|-------|-------|
| 1 | **Parish Google account** | owns the sheet + script + sends the emails. *(You don't give me any password — you run the setup; I only need the two values below.)* |
| 2 | **Parish UPI id (VPA)** | e.g. `ascensionchurch@okhdfcbank`, or a committee member's UPI id for now. This is where the money goes. |
| 3 | **Payee display name** | what shows in the donor's UPI app, e.g. `Ascension Church Vimusement` |
| 4 | 1–2 **reconciliation volunteers** | who tick confirmed gifts (daily near the event) |
| 5 | (optional) committee **reply-to email** | for donor replies |

---

## Setup

1. Create a Google Sheet **"Vimusement — Master"** (this is *this year's* sheet).
2. **Extensions ▸ Apps Script.** Delete the sample, paste **`apps-script/Code.gs`**. Save.
3. **Project Settings ▸ Script properties** — add:
   - `UPI_VPA` = your parish UPI id
   - `UPI_NAME` = the payee display name
   - *(optional)* `FROM_NAME` = `Vimusement`, `REPLY_TO` = committee email
4. In the editor, run **`_selfTest`** once → approve the permission prompt (Sheets + Gmail).
   Check the log: `Sheet OK`, `UPI_VPA set: true`, and a `Pledge test:` line with a
   `upi://pay?...` link. A `Donations` tab now exists with a Status dropdown.
5. **Triggers** (clock icon ▸ Add trigger) — add two:
   - function `onDonationEdit` · source *From spreadsheet* · type *On edit*
   - function `houseKeeping` · *Time-driven* · *Minutes timer* · *Every 15 minutes*
6. **Deploy ▸ New deployment ▸ Web app** · Execute as **Me** · Access **Anyone** →
   copy the URL ending in **`/exec`**.
7. Paste that URL into `years/2026.config.js` → `donation.api`. Push the site.
8. Reload the sheet once so the **Vimusement** menu appears.

---

## Verifying every step

No test cards needed — you'll send yourself **₹1 by real UPI** (you get it back, it's your account).

| Step | Do | Expect |
|------|----|--------|
| **V1 — script alive** | open `<api>?action=ping` | `{"ok":true,…}` |
| **V2 — empty wall** | open `<api>?action=donors` | `{"donors":[],"count":0}` |
| **V3 — pledge** | open `<api>?action=pledge&amount=1&name=Test&email=you@gmail.com` | `{"ref":"VIM26…","upiUri":"upi://pay?pa=…&am=1&tn=VIM26…",…}` and a new **Pending** row in the sheet |
| **V4 — validation** | `?action=pledge&amount=1&name=Test&email=notanemail` | `{"error":"Please add a valid email…"}` — no row |
| **V5 — the page** | on `donate.html`: ₹1, your name, your email, **Continue to pay** | a panel appears with a **QR**, the amount, the reference, an **Open my UPI app** button, and the parish UPI id |
| **V6 — pay** | scan the QR (or tap the button on a phone) and pay **₹1** to the parish id | money moves; note the reference is in the payment note if your app kept it |
| **V7 — I've paid** | tap **I've paid**, optionally paste the UPI reference, **Done** | page: "we'll verify and email you…"; the sheet row flips to **Paid?** (+ your UPI ref if entered) |
| **V8 — confirm** | in the sheet, set that row's **Status** to `Confirmed` (or select the row → menu **Vimusement ▸ Confirm selected donation rows**) | within a few seconds: **Confirmed at** fills in, and **you get the thank-you email** at the address you used |
| **V9 — wall** | reload `donate.html` (or wait 90 s) | your test name scrolls in the supporters wall. Inspect `<api>?action=donors` → the name is there, **no amount field anywhere** |
| **V10 — nothing leaks early** | check `?action=donors` again while a row is still `Pending`/`Paid?` | that name is **not** returned — only `Confirmed` names show |
| **V11 — stale pledge** | leave a `Pending` row; after `houseKeeping` runs (or run it from the editor) with the row >48h old | it becomes `Cancelled` automatically |
| **V12 — hide a name** | set a confirmed row's **Show on wall** to `No`, reload the site | that name drops off the wall, still counted in the sheet |
| **V13 — de-dupe email** | set an already-confirmed row back to `Confirmed` | no second email (guarded by "Confirmed at") |

When V1–V13 pass, you're live. Do one more real ₹1–₹10 gift end-to-end, then announce.

---

## The volunteer routine (daily near the event)

1. Open the parish bank / UPI app statement.
2. In the `Donations` tab, look at rows with Status `Pending` or `Paid?`.
3. For each one you can see in the statement (match on **amount + time + note/UPI ref**),
   set Status → **Confirmed**. Or tick several rows and use **Vimusement ▸ Confirm
   selected donation rows**.
4. The donor is emailed and the wall updates automatically.
5. Anything that never arrives: leave it — `houseKeeping` cancels stale pledges after 48h,
   or set it to `Cancelled` yourself.

---

## Optional phase 2 — auto-confirm from bank alert emails

If the parish account emails a credit alert for each UPI payment, you can skip the manual
tick:

1. Forward those alerts to the parish Gmail; make a filter that **labels** them
   `bank-alerts`.
2. Script property `ENABLE_EMAIL_RECONCILE = yes` (and `RECONCILE_LABEL` if you used a
   different label).
3. `houseKeeping` will read new alerts every 15 min, match the ₹ amount (and the `VIM…`
   reference if the bank includes the note), set Status `Confirmed`, and fire the same
   thank-you email.

This depends entirely on the bank's email wording — **test it with 3–4 real alerts** and
keep doing the manual check until you trust it. The manual path always works regardless.

---

## Notes & housekeeping

- **Donor emails** are personal data. They sit in column D only to send the confirmation.
  Clear the column (or the whole tab) after the impact report is published, or keep a
  policy line about it.
- **Email quota**: 100 confirmation emails/day on a normal Gmail. If a peak day exceeds
  that, `processConfirmations` will send the rest on the next run/day — nothing is lost.
- **UPI apps and the note/amount**: GPay and PhonePe honour the pre-filled amount; the
  note (`tn=`) is hit-or-miss. That's why matching is on **amount + time** first, with the
  reference as a helper.
- **Refunds**: do them from the bank/UPI app, then set the row's Status to `Cancelled` and
  add a note in column J.
