# apps-script/

The Google Apps Script backend — **one script, one Master sheet, one tab per feature.**

- `Code.gs` — paste into the Apps Script editor opened from *inside* the
  "Vimusement — Master" Google Sheet (Extensions ▸ Apps Script).

## Deploy (donations)

1. Paste `Code.gs`, save.
2. Project Settings ▸ Script properties: `UPI_VPA`, `UPI_NAME` (see `docs/donations-setup.md`).
3. Run `_selfTest` once, approve permissions (Sheets + Gmail).
4. Add triggers: `onDonationEdit` (On edit) and `houseKeeping` (time, every 15 min).
5. Deploy ▸ New deployment ▸ Web app — Execute as **Me**, Access **Anyone**.
6. Copy the `/exec` URL into `years/2026.config.js` → `donation.api`.

Full walkthrough + 13-step verification: **`docs/donations-setup.md`**.

## Endpoints (GET; POST also accepted)

| `?action=` | returns | purpose |
|---|---|---|
| `ping` | `{ok,time}` | health check |
| `pledge&amount=&name=&email=&wall=` | `{ref,upiUri,vpa,amount}` | create the row + UPI link |
| `ipaid&ref=&utr=` | `{ok}` | donor says they've paid → row `Paid?` |
| `donors` | `{donors:[name…],count}` | supporters wall — **names only** |
| `stats` | `{total,count}` | aggregate total (only if `donation.showTotal`) |

Confirmation + donor email happen in `processConfirmations()`, fired by the on-edit
trigger, the **Vimusement** sheet menu, and `houseKeeping`.

## Adding Movies / Food later

New function group in this same file (`bookMovie`, `confirmMovie`, `getShows`…), a new
`case` in `doGet`, a new tab constant like `DONATIONS_TAB`. Re-deploy as a **new version**
of the same web app (the URL stays the same).
