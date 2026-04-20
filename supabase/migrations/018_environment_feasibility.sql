-- ============================================================================
-- Migration 018: Environment profile + activity feasibility constraints
-- ============================================================================
-- Adds the physical-reality layer the AI needs to reason about whether an
-- activity actually fits a venue. Extends sp_venues with an environment
-- profile (indoor/outdoor, surface, ceiling, space, equipment, safety) and
-- sp_activities with the constraints that profile has to satisfy (minimum
-- ceiling, required surface, safety equipment, engagement thresholds).
--
-- Defaults are deliberately permissive so existing rows don't become invalid:
-- every activity starts with no hard constraints until a coach (or the AI,
-- via the activity-intelligence refactor tool) fills them in.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_venues — environment profile
-- ----------------------------------------------------------------------------
ALTER TABLE sp_venues
  ADD COLUMN IF NOT EXISTS venue_type TEXT NOT NULL DEFAULT 'indoor'
    CHECK (venue_type IN ('indoor', 'outdoor', 'hybrid')),
  ADD COLUMN IF NOT EXISTS surface_types TEXT[] NOT NULL DEFAULT ARRAY['artificial_mat']::TEXT[],
  ADD COLUMN IF NOT EXISTS ceiling_height_m NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS max_carry_m NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS max_run_distance_m NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS has_bowling_machines BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bowling_machine_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weather_protection TEXT NOT NULL DEFAULT 'fully_enclosed'
    CHECK (weather_protection IN ('fully_enclosed', 'covered', 'open')),
  ADD COLUMN IF NOT EXISTS lighting TEXT NOT NULL DEFAULT 'artificial'
    CHECK (lighting IN ('natural', 'artificial', 'mixed')),
  ADD COLUMN IF NOT EXISTS safety_features JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS environment_notes TEXT;

COMMENT ON COLUMN sp_venues.venue_type IS 'indoor = fully enclosed building; outdoor = open ground; hybrid = outdoor with covered areas';
COMMENT ON COLUMN sp_venues.surface_types IS 'Allowed surfaces: concrete, grass, synthetic_turf, artificial_mat, rubber';
COMMENT ON COLUMN sp_venues.ceiling_height_m IS 'Minimum usable ceiling height in metres. NULL = outdoor or not measured';
COMMENT ON COLUMN sp_venues.max_carry_m IS 'Longest clean carry possible before hitting wall/nets. Drives feasibility of lofted/power drills';
COMMENT ON COLUMN sp_venues.max_run_distance_m IS 'Longest continuous run lane. Drives feasibility of fitness work and running-3s between sets';
COMMENT ON COLUMN sp_venues.safety_features IS 'JSONB flags — { padded_walls: bool, netting: bool, mats_available: bool, first_aid: bool, ... }';

-- ----------------------------------------------------------------------------
-- 2. sp_activities — physical + engagement constraints
-- ----------------------------------------------------------------------------
ALTER TABLE sp_activities
  ADD COLUMN IF NOT EXISTS environment_required TEXT NOT NULL DEFAULT 'either'
    CHECK (environment_required IN ('indoor_ok', 'outdoor_only', 'either')),
  ADD COLUMN IF NOT EXISTS min_ceiling_m NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS min_carry_m NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS min_run_distance_m NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS required_surfaces TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS safety_equipment_required JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS min_players INTEGER,
  ADD COLUMN IF NOT EXISTS max_players_per_lane INTEGER,
  ADD COLUMN IF NOT EXISTS max_idle_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS engagement_notes TEXT;

COMMENT ON COLUMN sp_activities.environment_required IS 'indoor_ok = runs indoors or outdoors; outdoor_only = needs open ground (e.g., high-ball drills); either = no preference';
COMMENT ON COLUMN sp_activities.min_ceiling_m IS 'Minimum usable ceiling height. Lobs / straight-six drills typically need 5m+';
COMMENT ON COLUMN sp_activities.min_carry_m IS 'Minimum clean carry needed. Power-hitting drills with full follow-through often need 30m+';
COMMENT ON COLUMN sp_activities.min_run_distance_m IS 'Running room required (for between-sets 3s, sprint drills, etc.)';
COMMENT ON COLUMN sp_activities.required_surfaces IS 'Surfaces this drill REQUIRES. Empty = any surface acceptable. e.g., sliding drills = [grass, synthetic_turf]';
COMMENT ON COLUMN sp_activities.safety_equipment_required IS 'Safety kit that MUST be in place. e.g., { mats: true, helmets: true, netting: true }';
COMMENT ON COLUMN sp_activities.max_idle_pct IS 'Max acceptable per-player idle time as %. If a drill has 6 players in 20 mins with each getting 3 mins active, idle = 85% — flagged as low-engagement';

-- ----------------------------------------------------------------------------
-- 3. Seed Cutting Edge Cricket Centre (CEC, Bundoora) — the current venue
-- ----------------------------------------------------------------------------
-- Known facts: indoor facility, 7 bowling lanes (3 with machines, 4 standard),
-- artificial-mat surface, no outdoor oval, ~4.5m ceiling, ~25m carry per lane.
-- If CEC isn't present, the UPDATE is a no-op and nothing breaks.
UPDATE sp_venues
SET
  venue_type = 'indoor',
  surface_types = ARRAY['artificial_mat']::TEXT[],
  ceiling_height_m = 4.5,
  max_carry_m = 25.0,
  max_run_distance_m = 22.0,
  has_bowling_machines = TRUE,
  bowling_machine_count = 3,
  weather_protection = 'fully_enclosed',
  lighting = 'artificial',
  safety_features = jsonb_build_object(
    'padded_walls', TRUE,
    'netting', TRUE,
    'mats_available', TRUE,
    'first_aid', TRUE
  ),
  environment_notes = 'Indoor lane centre. No high-ball drills (ceiling < 5m). No grass-surface drills. Running 3s between sets works within the lane length. All batting blocks must have netting between lanes engaged.'
WHERE name ILIKE '%cutting edge%' OR short_name ILIKE '%CEC%';

-- ============================================================================
-- Rollback reference (NOT executed — manual use only)
-- ============================================================================
-- ALTER TABLE sp_venues
--   DROP COLUMN IF EXISTS venue_type,
--   DROP COLUMN IF EXISTS surface_types,
--   DROP COLUMN IF EXISTS ceiling_height_m,
--   DROP COLUMN IF EXISTS max_carry_m,
--   DROP COLUMN IF EXISTS max_run_distance_m,
--   DROP COLUMN IF EXISTS has_bowling_machines,
--   DROP COLUMN IF EXISTS bowling_machine_count,
--   DROP COLUMN IF EXISTS weather_protection,
--   DROP COLUMN IF EXISTS lighting,
--   DROP COLUMN IF EXISTS safety_features,
--   DROP COLUMN IF EXISTS environment_notes;
--
-- ALTER TABLE sp_activities
--   DROP COLUMN IF EXISTS environment_required,
--   DROP COLUMN IF EXISTS min_ceiling_m,
--   DROP COLUMN IF EXISTS min_carry_m,
--   DROP COLUMN IF EXISTS min_run_distance_m,
--   DROP COLUMN IF EXISTS required_surfaces,
--   DROP COLUMN IF EXISTS safety_equipment_required,
--   DROP COLUMN IF EXISTS min_players,
--   DROP COLUMN IF EXISTS max_players_per_lane,
--   DROP COLUMN IF EXISTS max_idle_pct,
--   DROP COLUMN IF EXISTS engagement_notes;
