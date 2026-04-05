# E2E Tests — RRA Session Planner

## Quick Start

```bash
cd app
E2E_PASSWORD=<your-password> npx playwright test
```

## Setup (one-time)

The tests authenticate against your Supabase project as `alex.lewis@rramelbourne.com`.

### Option A: You know your password
Just run the tests with it:
```bash
E2E_PASSWORD=YourPassword npx playwright test
```

### Option B: Set a new password via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/rrfghjhzdevmzzttvith/auth/users
2. Find `alex.lewis@rramelbourne.com`
3. Click the three-dot menu → "Send password recovery"
4. Follow the email link to set a new password
5. Use that password for the tests

### Option C: Create a dedicated e2e test user
1. In the Supabase Dashboard auth panel, click "Add user" → "Create new user"
2. Email: `e2e.test@rramelbourne.com`, set a password, check "Auto Confirm"
3. Run with:
```bash
E2E_EMAIL=e2e.test@rramelbourne.com E2E_PASSWORD=<password> npx playwright test
```

Note: non-admin users will see a reduced UI (no Settings tab, no AI Coach).
Add the email to the `ADMIN_EMAILS` array in `src/hooks/useUserRole.ts` for full access.

## What the tests cover

| # | Test | Auth? |
|---|------|-------|
| 1 | Login page loads | No |
| 2 | Sessions page loads | Yes |
| 3 | Session grid shows 8 lane headers | Yes |
| 4 | Month calendar renders | Yes |
| 5 | Activity Library with tier badges | Yes |
| 6 | Settings page with tabs | Yes |
| 7 | Dark mode toggle | Yes |
| 8 | AI Coach panel opens | Yes |
| 9 | Block creation dialog on grid | Yes |
| 10 | Export PDF button on session | Yes |
| 11 | Copy Hour dialog | Yes |

Without `E2E_PASSWORD`, only test 1 runs. The rest skip gracefully.

## Files

- `playwright.config.ts` — Config (chromium only, localhost:3000, auto-starts dev server)
- `tests/e2e/global-setup.ts` — Authenticates once, saves browser state
- `tests/e2e/session-planner.spec.ts` — All 11 test cases
- `tests/e2e/.auth/` — Saved auth state (gitignored)
