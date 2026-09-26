# The public ledger (the 40 · 30 · 30 pledge)

This year everything Vimusement raises, after event costs, is split up
front:

| Fund | Share | Sheet name for the Fund column |
|---|---|---|
| Education for the poor | 40% | `Education` |
| Medical & other needs | 30% | `Medical` |
| Youth Emergency Fund (held in reserve, used when it's needed most) | 30% | `Emergency` |

The homepage, the Cause page, the Donate page and the posters all show this
split. The Cause page also has a **public ledger** at `cause.html#ledger`
that lists every rupee in and out.

## One-time setup

1. Open the Apps Script project (Master sheet ▸ Extensions ▸ Apps Script),
   paste in the new `apps-script/Code.gs` and **redeploy**: Deploy ▸ Manage
   deployments ▸ edit ▸ Version: New version ▸ Deploy. The /exec URL stays
   the same.
2. Open `…/exec?action=ledger` once in a browser. This creates the
   **Ledger** tab with its drop-downs. The page should show
   `{"entries":[],"updated":null}`.

Until the fair, the ledger shows "The ledger opens after the fair".

## Adding rows (committee only)

Add one row for each time money moves:

| Date | Type | Fund | Amount | Details | Show on site |
|---|---|---|---|---|---|
| 25-Oct-2026 | Raised | | 98500 | Stall fees and stall share | Yes |
| 25-Oct-2026 | Raised | | 61250 | Lucky draw tickets | Yes |
| 25-Oct-2026 | Cost | | 18400 | Sound, lights and generator | Yes |
| 28-Oct-2026 | Payout | Education | 12500 | School fees, Class 9 student | Yes |
| 02-Dec-2026 | Payout | Emergency | 25000 | Emergency surgery support | Yes |

- **Everything in this tab is published. Never put a name in Details.**
  Describe what it paid for, not who received it.
- A **Payout** needs a Fund. Payout rows without one are left off the site.
- Leave **Show on site** empty or set it to Yes. Set it to No only to hold a row back while it's being checked.
- The website does the maths: raised − costs is shared 40 / 30 / 30, and
  each fund shows how much it has paid out and how much is still to give,
  or for the emergency fund, how much is held in reserve.
- Changes appear on the site within about 2 minutes.
