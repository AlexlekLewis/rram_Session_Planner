-- ============================================================
-- Migration 018: Tighten sp_player_block_assignments SELECT RLS
-- ============================================================
--
-- BEFORE: `pba_select` in migration 010 used `USING (true)`, meaning any
-- authenticated user could read every player-block assignment across
-- every program. That would leak player workload data across program
-- boundaries (a coach at Program A could enumerate assignments from
-- Program B).
--
-- AFTER: SELECT is program-scoped via the session → program_id chain.
-- A user can only read an assignment row if they are an active member
-- of the program that owns the assignment's session.
--
-- Source: Full Audit 2026-04-10, DB Architect agent, finding H1.
-- Helper `user_is_program_member(program_id)` comes from migration 015.
--
-- GUARDED: the `sp_player_block_assignments` table may not exist yet on
-- all deployments (migration 010 has not been applied in every env).
-- We guard with `to_regclass` so this migration is a no-op where the
-- table is absent, and correctly tightens RLS where it exists.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.sp_player_block_assignments') IS NOT NULL THEN
    -- Drop the permissive SELECT policy
    EXECUTE 'DROP POLICY IF EXISTS "pba_select" ON public.sp_player_block_assignments';

    -- Re-create as program-scoped
    EXECUTE $policy$
      CREATE POLICY "pba_select" ON public.sp_player_block_assignments
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.sp_sessions s
            WHERE s.id = sp_player_block_assignments.session_id
              AND user_is_program_member(s.program_id)
          )
        )
    $policy$;
  END IF;
END $$;

-- INSERT/UPDATE/DELETE policies are deliberately left alone in this
-- migration. They are gated by the role helper in 010 + 015 and are not
-- the cross-program data-leak vector. Tightening them to the
-- program-scoped pattern is tracked as follow-up M3 (P1, deferred).
