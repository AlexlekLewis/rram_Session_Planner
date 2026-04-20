-- ============================================================================
-- Migration 019: Confirm the E2E dev accounts so Playwright can authenticate
-- ============================================================================
-- The Playwright suite authenticates once in global-setup.ts using one of the
-- three e2e.* dev accounts. If those accounts exist in auth.users but have
-- email_confirmed_at = NULL, Supabase returns "Email not confirmed" on sign-
-- in and the suite's setup stage hard-fails (or, post-this PR, degrades to
-- skipped auth'd tests — still no coverage).
--
-- This migration confirms those three emails in place. Idempotent: running
-- it twice has no effect on already-confirmed accounts.
--
-- Password reminder (from tests/e2e/global-setup.ts): DevTest2026.
-- If the account doesn't exist yet, this migration is a no-op for that row —
-- create the account via Supabase Auth first, then re-run.
-- ============================================================================

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at       = COALESCE(confirmed_at, NOW()),
    updated_at         = NOW()
WHERE email IN (
  'e2e.admin@rramelbourne.com',
  'e2e.coach@rramelbourne.com',
  'e2e.player@rramelbourne.com'
)
  AND email_confirmed_at IS NULL;

-- Verification helper — prints which e2e rows exist and their confirmation
-- state. Safe to run after the UPDATE; returns 0-3 rows.
--
--   SELECT email, email_confirmed_at
--   FROM auth.users
--   WHERE email LIKE 'e2e.%@rramelbourne.com'
--   ORDER BY email;
