/*
# Soul-Binder's Abyss — Game Persistence Tables

## Summary
Creates two tables for persisting game run state and run history.
Single-tenant (no auth) — all data is shared/public via anon key.

## Tables

### run_saves
Stores the full serialized RunState for an active game session.
One row per session_id (upserted). Allows the player to close and
resume their run across browser refreshes.
- id: uuid primary key
- session_id: unique text identifier (generated client-side, stored in localStorage)
- run_state: full JSONB blob of all game state
- updated_at: last save timestamp

### run_history
Immutable ledger of completed runs (victory, death, damnation).
Used for a run-history/leaderboard screen.
- id: uuid primary key
- session_id: which session produced this run
- outcome: 'victory' | 'death' | 'damnation'
- stratum_reached: how deep the player got (1-5, plus boss = 6)
- soul_debt: accumulated soul debt at run end
- stress_at_end: stress level when run ended
- duration_seconds: total run time in seconds
- world_flags: JSONB snapshot of final world state
- created_at: when the run ended

## Security
RLS enabled on both tables.
All 4 policies use TO anon, authenticated with USING (true) /
WITH CHECK (true) — this is intentional for a single-tenant,
no-login game where all data is shared.
*/

CREATE TABLE IF NOT EXISTS run_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  run_state jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE run_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_run_saves" ON run_saves;
CREATE POLICY "anon_select_run_saves" ON run_saves FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_run_saves" ON run_saves;
CREATE POLICY "anon_insert_run_saves" ON run_saves FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_run_saves" ON run_saves;
CREATE POLICY "anon_update_run_saves" ON run_saves FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_run_saves" ON run_saves;
CREATE POLICY "anon_delete_run_saves" ON run_saves FOR DELETE
  TO anon, authenticated USING (true);


CREATE TABLE IF NOT EXISTS run_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('victory', 'death', 'damnation')),
  stratum_reached int NOT NULL DEFAULT 1,
  soul_debt int NOT NULL DEFAULT 0,
  stress_at_end int NOT NULL DEFAULT 0,
  duration_seconds int NOT NULL DEFAULT 0,
  world_flags jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE run_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_run_history" ON run_history;
CREATE POLICY "anon_select_run_history" ON run_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_run_history" ON run_history;
CREATE POLICY "anon_insert_run_history" ON run_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_run_history" ON run_history;
CREATE POLICY "anon_update_run_history" ON run_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_run_history" ON run_history;
CREATE POLICY "anon_delete_run_history" ON run_history FOR DELETE
  TO anon, authenticated USING (true);
