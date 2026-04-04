-- ============================================================
-- RRA Session Planner — Seed Data
-- Program, phases, venue, squads, and initial sessions
-- (Activities seeded via 004_seed_activities.sql)
-- ============================================================

-- ============================================================
-- PROGRAM
-- ============================================================
INSERT INTO sp_programs (id, name, start_date, end_date, description) VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'RRA Melbourne T20 Elite Program 2026',
  '2026-04-14',
  '2026-07-04',
  'Rajasthan Royals Academy Melbourne — 12-week T20 Elite development program. Three phases: Explore (discovery-based skill acquisition), Establish (technique consolidation), Excel (match simulation intensity).'
);

-- ============================================================
-- PHASES
-- ============================================================
INSERT INTO sp_phases (id, program_id, name, description, start_date, end_date, goals, sort_order) VALUES
(
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Explore',
  'Discovery-based skill acquisition and baseline assessment',
  '2026-04-14', '2026-05-09',
  '["Discovery-based skill acquisition", "Constraint-led exploration", "Baseline assessment", "Establish training culture"]',
  1
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Establish',
  'Consolidate technique foundations and game scenario integration',
  '2026-05-12', '2026-06-06',
  '["Consolidate technique foundations", "Game scenario integration", "Tactical awareness development", "Peer coaching introduction"]',
  2
),
(
  'a1b2c3d4-0002-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Excel',
  'Match simulation intensity and decision-making under pressure',
  '2026-06-09', '2026-07-04',
  '["Match simulation intensity", "Decision-making under pressure", "Individual development plans", "Program showcase preparation"]',
  3
);

-- ============================================================
-- VENUE
-- ============================================================
INSERT INTO sp_venues (id, name, short_name, address, lanes) VALUES (
  'a1b2c3d4-0003-4000-8000-000000000001',
  'Cutting Edge Cricket Centre',
  'CEC',
  'Bundoora, VIC',
  '[
    {"id": 1, "label": "Machine 1", "type": "bowling_machine", "short": "M1"},
    {"id": 2, "label": "Machine 2", "type": "bowling_machine", "short": "M2"},
    {"id": 3, "label": "Machine 3", "type": "bowling_machine", "short": "M3"},
    {"id": 4, "label": "Lane 4", "type": "long_lane", "short": "L4"},
    {"id": 5, "label": "Lane 5", "type": "long_lane", "short": "L5"},
    {"id": 6, "label": "Lane 6", "type": "long_lane", "short": "L6"},
    {"id": 7, "label": "Lane 7", "type": "long_lane", "short": "L7"},
    {"id": 8, "label": "Other Location", "type": "other", "short": "OTH"}
  ]'
);

-- ============================================================
-- SQUADS
-- ============================================================
INSERT INTO sp_squads (id, program_id, name, colour, description, session_days, max_players) VALUES
(
  'a1b2c3d4-0004-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Squad F',
  '#E11F8F',
  'Female Cricket',
  '[{"day": "Thursday", "time": "5:00-7:00pm"}, {"day": "Sunday", "time": "2:00-4:00pm"}]',
  12
),
(
  'a1b2c3d4-0004-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Squad 1',
  '#1226AA',
  'Elite/Advanced Males',
  '[{"day": "Tuesday", "time": "7:00-9:00pm"}, {"day": "Saturday", "time": "4:00-6:00pm"}]',
  12
),
(
  'a1b2c3d4-0004-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Squad 2',
  '#16A34A',
  'Younger Development Males',
  '[{"day": "Tuesday", "time": "5:00-7:00pm"}, {"day": "Saturday", "time": "2:00-4:00pm"}]',
  12
),
(
  'a1b2c3d4-0004-4000-8000-000000000004',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Squad 3',
  '#F97316',
  'Older Development Males',
  '[{"day": "Thursday", "time": "7:00-9:00pm"}, {"day": "Sunday", "time": "4:00-6:00pm"}]',
  12
);

-- ============================================================
-- SESSIONS — Week 1 of Explore Phase (Apr 14-19)
-- 4 squads × 2 sessions/week = 8 sessions per week
-- Weekday sessions at CEC, Weekend sessions at CEC
-- ============================================================

-- Tuesday Apr 14 — Squad 2 (5-7pm) + Squad 1 (7-9pm)
INSERT INTO sp_sessions (id, program_id, phase_id, venue_id, date, start_time, end_time, squad_ids, theme, status) VALUES
(
  'a1b2c3d4-0006-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-14', '17:00', '19:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000003']::UUID[],
  'Assessment Week — Baseline Testing',
  'draft'
),
(
  'a1b2c3d4-0006-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-14', '19:00', '21:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000002']::UUID[],
  'Assessment Week — Baseline Testing',
  'draft'
);

-- Thursday Apr 16 — Squad F (5-7pm) + Squad 3 (7-9pm)
INSERT INTO sp_sessions (id, program_id, phase_id, venue_id, date, start_time, end_time, squad_ids, theme, status) VALUES
(
  'a1b2c3d4-0006-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-16', '17:00', '19:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000001']::UUID[],
  'Assessment Week — Baseline Testing',
  'draft'
),
(
  'a1b2c3d4-0006-4000-8000-000000000004',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-16', '19:00', '21:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000004']::UUID[],
  'Assessment Week — Baseline Testing',
  'draft'
);

-- Saturday Apr 18 — Squad 2 (2-4pm) + Squad 1 (4-6pm)
INSERT INTO sp_sessions (id, program_id, phase_id, venue_id, date, start_time, end_time, squad_ids, theme, status) VALUES
(
  'a1b2c3d4-0006-4000-8000-000000000005',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-18', '14:00', '16:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000003']::UUID[],
  'Assessment Week — Skill Acquisition Baseline',
  'draft'
),
(
  'a1b2c3d4-0006-4000-8000-000000000006',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-18', '16:00', '18:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000002']::UUID[],
  'Assessment Week — Skill Acquisition Baseline',
  'draft'
);

-- Sunday Apr 19 — Squad F (2-4pm) + Squad 3 (4-6pm)
INSERT INTO sp_sessions (id, program_id, phase_id, venue_id, date, start_time, end_time, squad_ids, theme, status) VALUES
(
  'a1b2c3d4-0006-4000-8000-000000000007',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-19', '14:00', '16:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000001']::UUID[],
  'Assessment Week — Skill Acquisition Baseline',
  'draft'
),
(
  'a1b2c3d4-0006-4000-8000-000000000008',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000001',
  'a1b2c3d4-0003-4000-8000-000000000001',
  '2026-04-19', '16:00', '18:00',
  ARRAY['a1b2c3d4-0004-4000-8000-000000000004']::UUID[],
  'Assessment Week — Skill Acquisition Baseline',
  'draft'
);
