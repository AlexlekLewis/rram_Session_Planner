-- ============================================================
-- RRA Session Planner — Seed Activities
-- Complete Activity Library (56 activities)
-- All R/P/E/G tier data from RRA coaching planning documents
-- ============================================================

-- ============================================================
-- SKILL ACQUISITION — Physical / Technical Drills (23)
-- ============================================================

-- 1. 360 Drill
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000001',
  '360 Drill',
  'batting',
  'Batting Zones',
  'Batter nominates zone, works all 6 hitting zones around the wicket to develop 360-degree scoring ability.',
  '{"description": "Underarm feeds to nominated zone. Batter calls zone before each delivery. Work through all 6 zones in sequence: V, cover, point, square, fine, leg. No time pressure.", "coaching_points": ["Head position still at point of contact", "Watch the ball onto the bat face", "Feet move to the ball, not away", "Full face of bat for V zone", "Rotate through all 6 zones before repeating"], "equipment": ["Cricket balls", "Batting tee (optional)", "Zone markers/cones"]}',
  '{"description": "Side-arm feeds with pace. Batter nominates zone but feeder varies length, forcing footwork adjustment. Add target cones in each zone for accuracy.", "coaching_points": ["Adjust feet to length — front foot or back foot", "Maintain balance through the shot", "Bat speed through contact zone", "Wrist position changes per zone", "Commit to the nominated zone"], "equipment": ["Cricket balls", "Side-arm thrower", "Target cones", "Zone markers"]}',
  '{"description": "Machine or side-arm at 120-130kph. Batter nominates zone and must execute under match-pace pressure. Coach calls zone changes mid-over. Focus on kinetic chain — ground force reaction through feet, hip rotation, bat speed diagnostic.", "coaching_points": ["Ground Force Reaction — drive from the ground up", "Kinetic chain: feet-hips-torso-shoulders-arms-bat", "Bat speed as diagnostic — if speed drops, chain broke down", "Pre-movement trigger before ball release", "Self-coach: explain what happened after each ball"], "equipment": ["Cricket balls", "Bowling machine or side-arm", "Speed radar (optional)", "Zone markers"]}',
  '{"description": "Zone Roulette — spin the wheel or roll dice to assign a zone. 3 balls per zone. Score: 6 for perfect placement in zone, 4 for correct zone but imperfect, 1 for contact but wrong zone, 0 for miss. First to 50 wins.", "scoring_rules": "6 = perfect placement in zone, 4 = correct zone imperfect, 1 = contact wrong zone, 0 = miss. First to 50.", "consequence": "Loser does 10 push-ups or runs a lap."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Zone markers/cones", "Bowling machine (E tier)"]',
  ARRAY['batting', 'zones', '360', 'placement', 'shot selection', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 2. Hitting 3 Ways (6, 4, 1)
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000002',
  'Hitting 3 Ways (6, 4, 1)',
  'batting',
  'Shot Selection',
  'Pre-select or called shot intent — boundary (6), four (4), or single (1) — before each delivery to develop intent clarity.',
  '{"description": "Underarm feeds. Coach calls 6, 4, or 1 before each ball. Batter must adjust technique to match intent. Slow pace, focus on understanding what changes between each intent.", "coaching_points": ["6 = full swing, lofted, maximum bat speed", "4 = placement along the ground, pick the gap", "1 = soft hands, rotate strike, work into gaps", "Grip pressure changes with intent", "Stance and trigger movement differs per intent"], "equipment": ["Cricket balls", "Cones for targets"]}',
  '{"description": "Side-arm feeds. Batter self-selects intent before each ball and calls it aloud. Feeder varies length to test adaptability. Must still execute chosen intent regardless of length.", "coaching_points": ["Commit to the call — no changing mid-delivery", "Adjust feet to length while maintaining intent", "4 vs 1 is about bat angle and power, not just placement", "Watch for grip tightening on 6 intent", "Debrief: which intent felt hardest and why?"], "equipment": ["Cricket balls", "Side-arm thrower", "Target cones"]}',
  '{"description": "Machine at 120-140kph. Batter calls intent, executes under match pace. Self-coaching emphasis: after each set, batter explains kinetic chain differences between 6, 4, and 1. Bat speed measured — should see clear difference between intents.", "coaching_points": ["Intent clarity before the ball is bowled — decide early", "Kinetic chain sequencing changes with intent", "6: full GFR, hip clearance, high bat speed", "1: soft hands, controlled deceleration, placement", "Decision speed > execution quality — late decisions fail"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar", "Target cones"]}',
  '{"description": "Intent Poker — draw a card each ball (6/4/1). 3 balls per set. Score actual runs based on execution quality. Bonus points for perfectly matching intent. Play to 100.", "scoring_rules": "Score runs matching intent quality. Bonus +2 for perfect execution of called intent. -5 for getting out. First to 100.", "consequence": "Lowest scorer faces 6 balls of chin music (short pitch)."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Target cones", "Bat speed radar (optional)"]',
  ARRAY['batting', 'shot selection', 'intent', 'power', 'placement', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 3. Opposite Hand Hitting
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000003',
  'Opposite Hand Hitting',
  'batting',
  'Bat Speed / Adaptability',
  'Non-dominant hand batting for coordination, proprioception, and neural pathway development.',
  '{"description": "Underarm feeds only. Batter switches to non-dominant hand stance. Focus on basic contact — no power required. Slow feeds to build comfort and hand-eye coordination.", "coaching_points": ["Grip feels awkward — that is normal", "Focus on watching ball onto bat", "Feet should mirror dominant stance (reversed)", "Keep head still, eyes level", "Short backlift to start"], "equipment": ["Cricket balls", "Soft balls (optional for beginners)"]}',
  '{"description": "Side-arm feeds at moderate pace. Batter in non-dominant stance must now move feet and play through the line. Add targets for placement — not just contact.", "coaching_points": ["Front foot movement toward the ball", "Bat face control — keep it straight", "Use bottom hand more for control", "Rotate through V, cover, and leg zones", "Notice which shots feel easier — reveals dominant side habits"], "equipment": ["Cricket balls", "Side-arm thrower", "Target cones"]}',
  '{"description": "Machine at 100-120kph non-dominant side. This is a neural overload drill — forces the brain to rewire movement patterns. 2 overs non-dominant then switch back — bat speed on dominant side typically increases 5-10%. Self-coach: what did you learn?", "coaching_points": ["Neural pathway overload creates dominant-side improvement", "Kinetic chain awareness amplified — feel each link", "Do not try to hit boundaries — controlled contact only", "Observe hip rotation differences", "After switching back: note the bat speed improvement"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar"]}',
  '{"description": "Ambidextrous Challenge — 3 balls dominant, 3 balls non-dominant, alternate. Score runs from both sides. Non-dominant runs count double.", "scoring_rules": "Dominant-side runs count normal. Non-dominant runs count double. Play 4 overs (24 balls, alternating sets). Highest score wins.", "consequence": "Loser bats entire next drill non-dominant only."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Soft balls (optional)"]',
  ARRAY['batting', 'coordination', 'adaptability', 'opposite hand', 'neural', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 4. Rapid Fire
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000004',
  'Rapid Fire',
  'batting',
  'Hand-Eye / Reaction',
  'High-tempo feeds testing contact quality, reaction speed, and ability to reset between deliveries.',
  '{"description": "Underarm feeds in quick succession — 1 second gap between balls. Batter must make clean contact on each. No specific zone, just middle the ball. 6-ball bursts.", "coaching_points": ["Reset stance between each ball", "Eyes level, watch the ball early", "Short backlift — no time for a full swing", "Hands lead the bat", "Breathe between deliveries"], "equipment": ["Cricket balls (12+ per set)", "Feed bucket"]}',
  '{"description": "Side-arm rapid feeds — 1-second gap, varied length (short/full). Batter must adjust feet AND make contact. 6-ball bursts with 30-second rest. Increase tempo progressively.", "coaching_points": ["Feet must move despite the tempo", "Balance recovery between shots", "Back foot for short, front foot for full", "No fishing outside off — leave if needed", "Count clean contacts out of 6"], "equipment": ["Cricket balls (12+ per set)", "Side-arm thrower"]}',
  '{"description": "Machine at 130kph, balls every 3 seconds. Batter faces 12-ball sets. Focus: can the kinetic chain fire correctly under fatigue and time pressure? Bat speed should not drop below 80% of max across the set. This simulates death-over pressure.", "coaching_points": ["Kinetic chain must fire fast — no time for correction", "GFR still applies — do not lose ground contact", "Bat speed diagnostic: if it drops, what broke down?", "Mental reset between each ball — one ball at a time", "Decision speed is everything — decide before the ball arrives"], "equipment": ["Cricket balls (24+ per set)", "Bowling machine", "Bat speed radar"]}',
  '{"description": "Rapid Fire Survivor — 12 balls, count clean contacts. Any miss or edge = strike. 3 strikes and you are out. Last person standing wins. Tempo increases each round.", "scoring_rules": "Clean contact = safe. Edge/miss = 1 strike. 3 strikes = out. Last batter standing wins.", "consequence": "Eliminated batters become fielders and heckle (distraction training)."}',
  10, 1,
  '["Cricket balls (24+)", "Side-arm thrower", "Bowling machine (E tier)", "Feed bucket"]',
  ARRAY['batting', 'hand-eye', 'reaction', 'rapid fire', 'tempo', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 5. Attacking Footwork (Resistance Bands)
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000005',
  'Attacking Footwork (Resistance Bands)',
  'batting',
  'Footwork / Power',
  'Shadow then live with resistance bands attached to develop explosive footwork and ground force reaction.',
  '{"description": "Shadow footwork only — no ball. Band around waist attached to anchor. Practice front foot drive, back foot punch, and advance to spin. 3 sets of 6 reps each movement.", "coaching_points": ["Drive through the resistance — do not lean", "Front foot lands heel first, then rolls to toe", "Back foot: push off ball of foot, stay side-on", "Hips lead the movement", "Maintain balance at the end of each rep"], "equipment": ["Resistance bands", "Anchor point/partner", "Cricket bat"]}',
  '{"description": "Live underarm feeds with band resistance. Batter must move to the ball against the band pull. Footwork quality matters more than shot quality. 6 balls per set, 3 sets.", "coaching_points": ["Band forces engagement of glutes and quads", "Front foot stride should not shorten despite resistance", "Push off back foot powerfully — band exposes lazy feet", "Head stays still even under resistance load", "Remove band mid-set — feel the explosive difference"], "equipment": ["Resistance bands", "Anchor point/partner", "Cricket balls"]}',
  '{"description": "Side-arm at pace with band resistance. Focus on GFR — the band amplifies the ground force requirement. After 6 balls with band, remove band for 6 balls — the batter should feel explosive. Bat speed measured both ways. Kinetic chain starts at the ground — this drill proves it.", "coaching_points": ["Ground Force Reaction amplified by band resistance", "Kinetic chain: ground-feet-hips-torso-bat proven here", "Measure bat speed with and without band", "5-15% bat speed increase expected post-band removal", "Self-coach: describe what the feet felt like with vs without"], "equipment": ["Resistance bands", "Side-arm thrower", "Cricket balls", "Bat speed radar"]}',
  '{"description": "Band Battle — pairs, both with bands. Alternate sets. Compare bat speed improvement (with band vs without band). Biggest improvement percentage wins.", "scoring_rules": "Measure bat speed: 6 balls with band, 6 without. Calculate % improvement. Biggest % improvement wins.", "consequence": "Loser wears the band for the entire next drill."}',
  15, 1,
  '["Resistance bands", "Anchor point/partner", "Cricket balls", "Bat speed radar (optional)", "Side-arm thrower"]',
  ARRAY['batting', 'footwork', 'power', 'resistance bands', 'GFR', 'ground force', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 6. Dane Rampi (Everything Behind)
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000006',
  'Dane Rampi (Everything Behind)',
  'batting',
  'Placement / Wrists',
  'All shots must go behind square on both sides — developing wrist control, late shot adjustment, and unconventional placement.',
  '{"description": "Underarm feeds, full length. Every shot must be played behind square (fine leg to backward point arc). Work on late wrist adjustment to redirect the ball. No drives permitted.", "coaching_points": ["Wrist roll at point of contact", "Let the ball come to you — do not reach", "Open or close bat face late", "Fine leg: roll wrists over, close face", "Backward point: delay the shot, cut late"], "equipment": ["Cricket balls", "Cones marking behind-square zone"]}',
  '{"description": "Side-arm feeds varied length. All scoring must be behind square. Feeder mixes short and full to test back foot and front foot options behind the wicket. Add target areas for precision.", "coaching_points": ["Short ball: pull, hook, upper cut behind", "Full ball: flick, glance, late cut", "Weight transfer differs for each option", "Do not premeditate — read length first, then adjust wrists", "Top hand control for placement"], "equipment": ["Cricket balls", "Side-arm thrower", "Target cones behind square"]}',
  '{"description": "Machine at 120-130kph. All scoring behind square. Simulates situations where straight hitting is blocked by the field. Bat speed diagnostic: wrist snap speed at contact determines placement quality. Self-coach: explain the wrist position for each shot.", "coaching_points": ["Kinetic chain still applies — wrists are the final link", "Bat speed through contact zone must be maintained", "Late adjustment is a skill — not a flaw", "Study field set: when would you play behind square in a match?", "Self-coach: describe wrist position for fine leg vs backward point"], "equipment": ["Cricket balls", "Bowling machine", "Target cones"]}',
  '{"description": "Rampi Challenge — any shot in front of square is out. Runs scored behind square count normal. Play a 2-over innings. Highest score survives. Getting out (front of square) = immediate elimination.", "scoring_rules": "Runs behind square count normally. Any shot in front of square = out. Play 2 overs (12 balls). Highest score wins.", "consequence": "Eliminated batters serve as ball retrievers."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Target cones"]',
  ARRAY['batting', 'placement', 'wrists', 'behind square', 'dane rampi', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 7. Hurdle Hop to Spin
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000007',
  'Hurdle Hop to Spin',
  'batting',
  'Footwork / Spin Play',
  'Explosive advance over mini hurdles to a spin delivery — develops dynamic footwork and commitment to getting to the pitch of the ball.',
  '{"description": "Shadow first — hop over 2 mini hurdles then take stance and shadow a drive. Progress to underarm spin feeds after clearing hurdles. Focus on balance at point of contact.", "coaching_points": ["Explosive first step over hurdles", "Land balanced — not falling forward", "Eyes adjust from hurdles to ball quickly", "Front foot reaches the pitch of the ball", "Head over front knee at contact"], "equipment": ["Mini hurdles (2-3)", "Cricket balls", "Spin feed"]}',
  '{"description": "Side-arm spin feeds after hurdle clearance. Batter hops 2-3 hurdles then must advance to spin and play a lofted drive or sweep. Spin direction varied (off-spin, leg-spin). Timer on transition speed.", "coaching_points": ["Transition from athletic movement to batting stance", "Read spin direction while moving", "Commit to advance — half measures get stumped", "Front foot plants firmly, knee bends for power", "Head stays still despite dynamic movement before"], "equipment": ["Mini hurdles (2-3)", "Cricket balls", "Side-arm thrower (spin)"]}',
  '{"description": "Full pace spin (side-arm or live spinner). Hurdle hop simulates the explosive advance needed in T20 against spin. Kinetic chain: ground force from the landing drives hip rotation into the lofted shot. Bat speed should not drop despite the preceding athletic movement.", "coaching_points": ["GFR from hurdle landing transfers into shot power", "Kinetic chain fires immediately on landing", "Bat speed must match standing equivalent — if not, chain is broken", "T20 context: this advance is how you hit spin for 6", "Self-coach: compare power standing vs after hurdles"], "equipment": ["Mini hurdles (2-3)", "Cricket balls", "Side-arm thrower", "Bat speed radar"]}',
  '{"description": "Hurdle Race to Hit — pairs race over hurdles to reach the crease first. First to arrive faces the spin delivery. Score 6 for clearing the boundary, 4 for placement, 0 for miss. Race component adds pressure and urgency.", "scoring_rules": "Race over hurdles. Winner faces spin. 6 = boundary clearance, 4 = good placement, 0 = miss. Loser gets 0 for that ball. First to 30.", "consequence": "Loser adds an extra hurdle for next round."}',
  15, 2,
  '["Mini hurdles (2-3)", "Cricket balls", "Side-arm thrower"]',
  ARRAY['batting', 'footwork', 'spin', 'advance', 'hurdles', 'agility', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 8. Closed vs Open Gate
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000008',
  'Closed vs Open Gate',
  'batting',
  'Foot Position Awareness',
  'Front foot gate selection for spin play — understanding when to open and close the front foot gate for different spin deliveries.',
  '{"description": "Shadow drill: coach calls open or closed. Batter plants front foot in correct gate position. No ball — pure footwork. Open gate = front foot points toward off side. Closed gate = front foot points toward leg side.", "coaching_points": ["Open gate: front foot opens to off side, allows driving through cover", "Closed gate: front foot closes toward leg, allows sweeping/working leg side", "Knee bend on landing", "Head and eyes stay level regardless of gate", "Back foot pushes off to initiate movement"], "equipment": ["Cones marking gate positions", "Cricket bat"]}',
  '{"description": "Underarm spin feeds. Coach calls gate before delivery. Batter must plant correct foot position and play appropriate shot for that gate. Open gate = drive through cover. Closed gate = sweep or flick.", "coaching_points": ["Gate selection determines shot options", "Open gate for off-spin driven through cover", "Closed gate for leg-spin swept or flicked", "Weight distribution changes with each gate", "Wrong gate = wrong shot = trouble"], "equipment": ["Cricket balls", "Cones", "Spin feed"]}',
  '{"description": "Side-arm or live spin at pace. Batter must read the spin direction and self-select the correct gate in real time. No coach calling — decision is the batter''s. Kinetic chain: correct gate position allows proper hip rotation for power. Wrong gate blocks the chain.", "coaching_points": ["Read spin from the hand — pick up cues early", "Gate selection must happen during the bowler''s action", "Correct gate enables full kinetic chain", "Wrong gate blocks hip rotation — power leak", "Self-coach: explain why you chose that gate"], "equipment": ["Cricket balls", "Side-arm thrower (spin)", "Bat speed radar"]}',
  '{"description": "Gate Quiz — spinner bowls, batter calls gate aloud before playing shot. Coach judges: correct gate + good shot = 6, correct gate + poor shot = 2, wrong gate = -3. Play 12 balls.", "scoring_rules": "Correct gate + good shot = 6. Correct gate + poor shot = 2. Wrong gate = -3. Play 12 balls. Highest total wins.", "consequence": "Lowest scorer faces 6 balls blindfolded (Blind Batting drill)."}',
  15, 2,
  '["Cricket balls", "Cones for gate markers", "Side-arm thrower (spin)"]',
  ARRAY['batting', 'footwork', 'spin play', 'gate', 'front foot', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 9. Heel-Toe Runway
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000009',
  'Heel-Toe Runway',
  'batting',
  'Weight Transfer',
  'Heel-first weight transfer against spin — emphasises proper weight distribution through the front foot.',
  '{"description": "Shadow drill: walk through the heel-toe weight transfer in slow motion. Heel lands first, rolls to toe, weight transfers forward. No ball — just feel the movement pattern. 10 reps each foot.", "coaching_points": ["Heel strikes first on front foot landing", "Roll through to toe — this transfers weight forward", "Head moves forward with the weight transfer", "Back foot lifts slightly as weight shifts", "Smooth transition, not jarring"], "equipment": ["Cricket bat"]}',
  '{"description": "Underarm spin feeds with focus on heel-toe transfer. Batter must exaggerate the heel-first landing. Coach watches foot plant from side-on. Quality of weight transfer determines shot power.", "coaching_points": ["Heel-toe creates forward momentum into the shot", "Contrast: flat-foot landing blocks weight transfer", "Feel the power difference between heel-toe and flat", "Front knee bends after heel strike", "Drives against spin require this weight transfer"], "equipment": ["Cricket balls", "Spin feed"]}',
  '{"description": "Side-arm spin at pace. Heel-toe transfer must happen under time pressure. This is the difference between getting to the pitch and being stuck in the crease against spin. GFR starts at the heel strike. Measure bat speed with correct vs incorrect weight transfer.", "coaching_points": ["GFR chain starts at heel strike — this is the ignition", "Heel-toe at pace requires commitment — no half steps", "Bat speed correlates directly with weight transfer quality", "Against quality spin, you get to the pitch or you are a victim", "Self-coach: feel where weight is at point of contact"], "equipment": ["Cricket balls", "Side-arm thrower (spin)", "Bat speed radar"]}',
  '{"description": "Heel-Toe Challenge — coach marks foot landing on each delivery (H for heel-first, F for flat). Only heel-first deliveries score runs. Flat landings = 0 runs regardless of shot quality. Play 12 balls.", "scoring_rules": "Heel-first landing: runs count normally. Flat landing: 0 runs regardless. Play 12 balls. Highest score wins.", "consequence": "Worst scorer does 20 heel-toe walks the length of the pitch."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bat speed radar (optional)"]',
  ARRAY['batting', 'weight transfer', 'heel-toe', 'spin play', 'footwork', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 10. Back Foot Heel Release
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000010',
  'Back Foot Heel Release',
  'batting',
  'Back Foot Technique',
  'Weight transfer on cuts and back foot punches — releasing the back heel to generate power through the shot.',
  '{"description": "Shadow drill: back foot cut motion with focus on heel release. Back foot heel lifts off the ground as weight transfers into the cut. Exaggerate the movement. 10 reps each side.", "coaching_points": ["Back foot heel lifts as hands drive through the ball", "Weight goes from back foot to ball of foot", "This releases the hips to rotate", "Head stays level despite the weight shift", "Practice both cut and back foot punch"], "equipment": ["Cricket bat"]}',
  '{"description": "Underarm short-pitch feeds. Batter plays back foot cut and back foot punch with emphasis on heel release. Coach watches from behind: heel must visibly lift at point of contact.", "coaching_points": ["Short ball trigger: back and across first", "Heel release happens AT contact, not before", "Compare power with heel grounded vs heel released", "Arms extend through the shot after heel release", "Top hand guides, bottom hand powers through"], "equipment": ["Cricket balls", "Short-pitch feed markers"]}',
  '{"description": "Machine at 125-135kph, short of a length. Batter plays back foot shots with focus on heel release for power. Bat speed measured — heel release should add 10-15% to back foot shot bat speed. Kinetic chain: back heel release unlocks the hip rotation that the back foot stance otherwise blocks.", "coaching_points": ["Heel release unlocks hip rotation on back foot shots", "Kinetic chain blocked if heel stays grounded", "Bat speed diagnostic: grounded heel = power leak", "Match context: this is how you punish short balls", "Self-coach: describe what happens to your hips when heel releases"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar"]}',
  '{"description": "Heel Release Audit — coach marks each ball: released or grounded. Only released-heel shots count for runs. 12 balls. Also measure bat speed differential.", "scoring_rules": "Released heel: runs count. Grounded heel: 0 runs. Play 12 balls. Track bat speed difference. Highest score + biggest speed difference combined.", "consequence": "Worst performer does 15 back foot jumps."}',
  15, 1,
  '["Cricket balls", "Bowling machine (E tier)", "Bat speed radar (optional)"]',
  ARRAY['batting', 'back foot', 'heel release', 'cut', 'punch', 'power', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 11. Pivot Power Station
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000011',
  'Pivot Power Station',
  'batting',
  'Hip Rotation / Power',
  'Front foot pivot for power generation — isolating the hip rotation that drives bat speed through the ball.',
  '{"description": "Shadow drill: front foot plants, pivots on the ball of the foot, hips rotate through. No ball. Focus on feeling the hip drive and how it connects to the hands. 10 reps each shot (drive, pull, sweep).", "coaching_points": ["Front foot pivot is the engine of power", "Plant ball of foot, rotate heel outward", "Hips open toward the target", "Hands follow hips — never lead them", "Feel the connection: foot-hip-torso-hands"], "equipment": ["Cricket bat"]}',
  '{"description": "Underarm feeds with pivot focus. Batter must exaggerate the front foot pivot on every shot. Coach watches hip clearance — hips must fully open toward the target. Varied shots: drive, sweep, flick.", "coaching_points": ["Pivot enables hip clearance", "Blocked hips = arms-only shot = weak", "Drive: pivot opens hips to off side", "Pull: pivot opens hips to leg side", "Sweep: pivot is smaller but still present"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm or machine at pace. Pivot under time pressure. GFR chain: ground contact through front foot pivot drives hip rotation which generates bat speed. Bat speed measured — correlation between pivot quality and speed is the learning objective.", "coaching_points": ["GFR peaks during the pivot — maximum force transfer", "Kinetic chain: pivot is the gateway between lower and upper body", "No pivot = disconnected upper/lower body = weak shot", "Bat speed directly correlates to pivot quality", "Self-coach: describe what your hips felt like on your best shot"], "equipment": ["Cricket balls", "Side-arm thrower or bowling machine", "Bat speed radar"]}',
  '{"description": "Pivot Power Leaderboard — 6 balls each, bat speed measured. Rank by maximum bat speed achieved. Coach rates pivot quality 1-5 on each ball. Combined score (speed + pivot rating) determines winner.", "scoring_rules": "Max bat speed + coach pivot rating (1-5 per ball). 6 balls each. Combined total wins.", "consequence": "Lowest scorer does 10 pivot lunges each leg."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Bat speed radar"]',
  ARRAY['batting', 'pivot', 'hip rotation', 'power', 'GFR', 'kinetic chain', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 12. Ladder Feet to Live Ball
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000012',
  'Ladder Feet to Live Ball',
  'batting',
  'Agility / Transition',
  'Speed ladder footwork directly into batting stance and live ball — develops quick feet and the ability to transition from athletic movement to batting readiness.',
  '{"description": "Speed ladder patterns (2-in-2-out, lateral, icky shuffle) then immediately take stance and face underarm feed. Focus on resetting balance after ladder work. 3 balls per ladder rep.", "coaching_points": ["Quick feet through the ladder", "Transition to still head at the crease", "Eyes must switch from ladder to ball quickly", "Stance should be balanced despite prior movement", "Athletic ready position between ladder and ball"], "equipment": ["Speed ladder", "Cricket balls"]}',
  '{"description": "Complex ladder patterns then side-arm feeds. Increase ladder speed and complexity. Batter must play quality shots immediately after ladder work. Time pressure: ball fed within 1 second of ladder completion.", "coaching_points": ["Fast feet create fast hands", "Do not sacrifice ladder quality for speed", "Transition is the skill — ladder AND batting", "Breathing: exhale during ladder, inhale at crease", "Ball fed immediately — no time to compose"], "equipment": ["Speed ladder", "Cricket balls", "Side-arm thrower"]}',
  '{"description": "High-intensity ladder patterns into machine balls at 120kph. Simulates the fitness and agility demand of T20 batting — run hard between wickets then face the next ball immediately. Bat speed should not drop despite fatigue. GFR must be maintained.", "coaching_points": ["T20 demands: run between wickets then face immediately", "GFR must fire even when fatigued", "Bat speed drop under fatigue = fitness issue not technique", "Kinetic chain compromised by fatigue — identify which link breaks first", "Self-coach: what was the first thing to fail?"], "equipment": ["Speed ladder", "Cricket balls", "Bowling machine", "Bat speed radar"]}',
  '{"description": "Ladder Relay — teams race through ladder then face 3 balls. Team combined runs after 3 batters each. Fastest ladder time + most runs = winners.", "scoring_rules": "Teams of 3. Each member: complete ladder + face 3 balls. Combined ladder time (lower is better) + combined runs. Best combined score wins.", "consequence": "Losing team runs extra ladder sets during water break."}',
  15, 2,
  '["Speed ladder", "Cricket balls", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'agility', 'ladder', 'footwork', 'transition', 'fitness', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 13. Must Go For 6
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000013',
  'Must Go For 6',
  'batting_power',
  'Power Hitting',
  'Maximum intent, lofted mechanics, and target zones — every ball must be hit with 6 intent.',
  '{"description": "Underarm full feeds. Every ball must be lofted with maximum intent. No placement — pure power. Work on getting under the ball and driving through with full swing. Target: over the bowler''s head.", "coaching_points": ["Get under the ball — low to high swing path", "Full backlift for maximum bat speed", "Head stays still, eyes on the ball", "Follow through over the front shoulder", "Bottom hand drives through the ball"], "equipment": ["Cricket balls", "Cones for boundary markers"]}',
  '{"description": "Side-arm feeds at pace. Must loft every ball. Feeder varies length — batter must adjust but intent remains 6. Full and short balls both need a power response. Target zones: straight, cow corner, over cover.", "coaching_points": ["Full ball: get to the pitch, drive through the line lofted", "Short ball: pull/hook with intent for 6", "Commit to the shot — half-hearted loft = caught", "Body position: weight forward for full, back for short", "Backlift and bat speed are non-negotiable"], "equipment": ["Cricket balls", "Side-arm thrower", "Boundary marker cones"]}',
  '{"description": "Machine at 130-140kph. Every ball lofted with 6 intent. This is the T20 power skill. Full kinetic chain: GFR through front foot, hip clearance, torso rotation, bat speed through the line. Bat speed must exceed match threshold. Self-coach: where did the power come from?", "coaching_points": ["Full kinetic chain required for power at pace", "GFR through front foot plants drives everything", "Hip clearance: hips must fully open toward target", "Bat speed diagnostic: below threshold = chain failure", "Decision is already made — every ball is 6 — just execute"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar", "Boundary markers"]}',
  '{"description": "6-Hitting Contest — 6 balls each. Score only if the ball clears the boundary marker (15m+). Bonus for clearing back net. Head-to-head knockout format.", "scoring_rules": "6 for clearing boundary marker. Bonus 2 for clearing back net. 0 for anything else. 6 balls each. Highest total advances. Knockout until champion.", "consequence": "Non-qualifiers do 20 burpees."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Bat speed radar", "Boundary markers"]',
  ARRAY['batting', 'power hitting', 'loft', 'six hitting', 'bat speed', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 14. Sweeps
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000014',
  'Sweeps',
  'batting',
  'Sweep Technique',
  'Conventional, reverse, and paddle sweep progression — developing the full sweep arsenal for spin play.',
  '{"description": "Underarm spin feeds. Work through 3 sweep types in sequence: conventional sweep, reverse sweep, paddle sweep. 6 balls each type. No pressure, focus on technique for each variant.", "coaching_points": ["Conventional: front foot plants, roll wrists over, play along the ground", "Reverse: grip change, open bat face, guide behind square", "Paddle: soft hands, redirect fine, minimal bat movement", "Front knee bends for all sweeps", "Eyes on the ball through contact"], "equipment": ["Cricket balls", "Spin feed"]}',
  '{"description": "Side-arm spin feeds. Coach calls sweep type before each delivery. Batter must execute the called sweep. Mix in good-length balls that should NOT be swept — shot selection component added.", "coaching_points": ["Not every ball should be swept — read length", "Conventional sweep: full or slightly short only", "Reverse sweep: works on good length outside off", "Paddle: best for straight or leg stump line", "If in doubt, play straight"], "equipment": ["Cricket balls", "Side-arm thrower (spin)"]}',
  '{"description": "Live spin or side-arm at pace. Batter self-selects sweep type based on line, length, and spin direction. Match simulation: field set shown, batter decides optimal sweep. Kinetic chain in sweeps: ground force through front knee, hip rotation determines sweep direction.", "coaching_points": ["Sweep selection based on line and length — not predetermined", "GFR through front knee (not foot) in sweeps", "Hip rotation: conventional = toward leg, reverse = toward off", "Bat speed still matters in sweeps — it is not a block", "Self-coach: when would you use each sweep in a match?"], "equipment": ["Cricket balls", "Side-arm thrower (spin)", "Bat speed radar"]}',
  '{"description": "Sweep Bingo — grid with 9 targets (3x3). Each target needs a specific sweep type. Fill the grid by placing shots in the correct zone with the correct sweep. First to complete a row/column/diagonal wins.", "scoring_rules": "3x3 target grid. Correct sweep type in correct zone fills the cell. First to complete a line (row/column/diagonal) wins bingo.", "consequence": "Non-winners do 10 lunges each leg."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower (spin)", "Target cones/zones"]',
  ARRAY['batting', 'sweep', 'reverse sweep', 'paddle', 'spin play', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 15. Helicopter
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000015',
  'Helicopter',
  'batting_power',
  'Power / Wrist Work',
  'Wrist roll and helicopter shot mechanics for yorker-length deliveries — the signature T20 power shot.',
  '{"description": "Drop feeds at yorker length. Batter practices wrist roll through contact. Bat finishes over the front shoulder in a helicopter motion. No power requirement — just the wrist mechanics and follow-through shape.", "coaching_points": ["Ball is at your feet — dig it out", "Wrists roll over through contact", "Bat follows through over front shoulder", "Bottom hand powers, top hand guides", "Head stays down — do not pull away early"], "equipment": ["Cricket balls (yorker length feeds)"]}',
  '{"description": "Side-arm yorker feeds. Batter must execute helicopter shot with increasing power. Focus on wrist snap timing — too early and it goes to ground, too late and it is a mishit. Target: straight back or over midwicket.", "coaching_points": ["Wrist snap timing is everything", "Early snap = grounded, late snap = top edge", "Power comes from bottom hand wrist roll", "Follow through must complete fully", "Plant front foot alongside the ball"], "equipment": ["Cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine at 130kph, full yorker length. Helicopter shot under match-pace pressure. Kinetic chain: despite the cramped position, GFR still fires through the front foot. Wrist speed is the bat speed equivalent here. Measure wrist speed correlation with distance.", "coaching_points": ["GFR still applies even when jammed — push off front foot", "Kinetic chain compressed but still present", "Wrist speed = bat speed in this shot", "This shot saves you from yorkers — it is not optional", "Self-coach: describe the feeling of a well-timed helicopter"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar"]}',
  '{"description": "Helicopter Showdown — yorker feeds only. Score: 6 for clearing boundary, 4 for strong contact over 10m, 2 for clean dig-out, 0 for miss. 6 balls each. Championship format.", "scoring_rules": "6 = boundary clearance, 4 = strong contact 10m+, 2 = clean dig-out, 0 = miss. 6 balls per round. Knockout.", "consequence": "Losers face 6 more yorkers immediately."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'helicopter', 'wrist', 'power', 'yorker', 'T20', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 16. Scoop Dog
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000016',
  'Scoop Dog',
  'batting',
  'Ramp / Innovation',
  'Ramp and scoop shot over the keeper — developing the innovative shot that exploits the fine leg area.',
  '{"description": "Underarm feeds at good length. Batter opens bat face and scoops over the keeper position. Start with gentle feeds and focus on bat angle. No power — just timing and angle.", "coaching_points": ["Open bat face early — before the ball arrives", "Get inside the line of the ball", "Deflect, do not hit — use the pace of the ball", "Bat angle determines direction: finer = more over keeper", "Stay low through the shot"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm feeds with pace. Batter scoops and ramps with increasing pace on the feeds. Mix straight and on the pads to test shot selection — only scoop when the line invites it.", "coaching_points": ["Pace on the ball does the work — do not force it", "Line: on the pads or straight = scoop option", "Outside off = do not scoop — too risky", "Pre-movement: open stance slightly for the scoop", "Commit fully or abandon entirely"], "equipment": ["Cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine at 125-135kph. Scoop and ramp under match pace. This is an elite T20 skill — requires supreme confidence and timing. The pace of the ball generates all the power. Bat speed is low but timing window is tiny. Self-coach: when is this shot the right option?", "coaching_points": ["Timing window is 0.1 seconds — pure reaction", "Pace of the ball = power of the shot", "If the ball is not in the right zone, abort", "Match context: scoop when fine leg is up in the powerplay", "Self-coach: what ball made you consider NOT scooping?"], "equipment": ["Cricket balls", "Bowling machine"]}',
  '{"description": "Scoop Dog Contest — only runs scored behind the keeper count. 12 balls each. Bonus points for scoops that clear the keeper by 3+ meters. Style points from teammates.", "scoring_rules": "Runs behind keeper count double. Scoop clearing keeper by 3m+ = 6 automatic. Style points voted by peers (1-3). 12 balls.", "consequence": "Least stylish scooper wears a dog costume for next drill (if available, otherwise 10 burpees)."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'scoop', 'ramp', 'innovation', 'T20', 'fine leg', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 17. Switch Hitter
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000017',
  'Switch Hitter',
  'batting',
  'Adaptability',
  'Stance change and opposite-side hitting — switching batting stance mid-delivery to disrupt the bowler and access different scoring areas.',
  '{"description": "Shadow drill: practice the switch from dominant to non-dominant stance. Time the switch — it should happen after the bowler starts the run-up but before delivery. Then underarm feeds in the switched stance.", "coaching_points": ["Switch timing: during bowler approach, before release", "Feet mirror the original stance (reversed)", "Grip adjusts slightly — top and bottom hand swap emphasis", "Head stays central and level during the switch", "Start with simple contact — no power needed"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm feeds. Batter switches stance before each delivery. Must play legitimate shots from the switched position. Add shot selection: 6, 4, or 1 from the switched stance.", "coaching_points": ["Switch creates new scoring zones", "Leg side becomes off side — changes field dynamics", "Do not switch too late — must be set before delivery", "Shot selection in switched stance may differ from normal", "Practice both switch directions"], "equipment": ["Cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine at 120kph. Switch hit under match pace. Elite skill — used strategically in T20 to exploit field gaps. The kinetic chain must fire from the switched position. Bat speed measured: should be within 80% of normal stance speed.", "coaching_points": ["Strategic weapon — use when field is set for dominant stance", "Kinetic chain must rewire for switched stance", "Bat speed target: 80%+ of dominant stance", "Match context: switch when leg-side field is packed", "Self-coach: what felt different in the kinetic chain?"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar"]}',
  '{"description": "Switch Hit Showdown — alternate balls: normal stance and switched stance. Runs from switched stance count double. 12 balls (6 normal, 6 switched). Total score decides winner.", "scoring_rules": "Normal stance: runs count normally. Switched stance: runs count double. 12 balls alternating. Highest total wins.", "consequence": "Lowest scorer bats switched for the entire next drill."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Bat speed radar"]',
  ARRAY['batting', 'switch hit', 'adaptability', 'innovation', 'T20', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 18. Inside Out
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000018',
  'Inside Out',
  'batting',
  'Loft / Placement',
  'Inside-out loft over cover — the signature T20 shot for manufacturing runs against spin and medium pace.',
  '{"description": "Underarm feeds outside off stump. Batter creates room and lofts inside-out over cover. Focus on clearing the front leg and opening the bat face. No power — timing and placement.", "coaching_points": ["Create room by moving leg side", "Open bat face toward cover", "Loft comes from getting under the ball", "Front leg clears to allow the swing path", "Watch the ball onto the bat — do not look at the target early"], "equipment": ["Cricket balls", "Target cones at cover"]}',
  '{"description": "Side-arm feeds with pace, on and outside off. Batter executes inside-out loft. Feeder varies line slightly — must read whether inside-out is the right option. Add power progressively.", "coaching_points": ["Only inside-out when ball is outside off", "On the pads = do not inside-out, play leg side", "Room creation must be subtle — not a big jump", "Bottom hand drives through the loft", "Follow through toward extra cover"], "equipment": ["Cricket balls", "Side-arm thrower", "Target cones"]}',
  '{"description": "Machine at 120-130kph. Inside-out loft under match pace. Kinetic chain for inside-out: room creation shifts the base, but GFR must still fire through the front foot. Hip rotation is toward cover, not straight. Bat speed measured — this shot requires significant bat speed.", "coaching_points": ["GFR through front foot despite the room creation", "Hip rotation toward cover — not straight", "Bat speed must be high — this is not a deft shot", "Kinetic chain: unusual direction but same principles", "Self-coach: describe hip position at contact"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar", "Target cones"]}',
  '{"description": "Inside-Out Challenge — only runs scored over cover (between point and mid-off) count. 12 balls. Bonus for clearing the boundary in the cover zone. Any shot not over cover = 0.", "scoring_rules": "Runs over cover only count. Boundary over cover = 6. Along ground through cover = 4. Wrong zone = 0. 12 balls.", "consequence": "Lowest scorer bats with one hand for next drill."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Target cones", "Bat speed radar"]',
  ARRAY['batting', 'inside out', 'loft', 'cover', 'T20', 'placement', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 19. Slog Sweep Showdown
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000019',
  'Slog Sweep Showdown',
  'batting_power',
  'Power Sweep',
  'Slog sweep power and selection — the high-risk, high-reward sweep that clears the boundary in T20 cricket.',
  '{"description": "Underarm spin feeds, full length. Batter goes down on one knee and slog sweeps with maximum power. Target: midwicket boundary. Focus on getting under the ball and clearing the front leg.", "coaching_points": ["Drop to front knee early", "Clear the front leg — it must not block the swing", "Swing path: low to high, across the line", "Eyes on the ball all the way to contact", "Full follow-through over the shoulder"], "equipment": ["Cricket balls", "Boundary markers"]}',
  '{"description": "Side-arm spin feeds at pace. Slog sweep with shot selection — only slog sweep when the ball is in the right zone (full, on or around off stump). Short or wide = play a different shot. Power and placement combined.", "coaching_points": ["Selection: full and around off = slog sweep zone", "Short balls = do not slog sweep, pull instead", "Wide outside off = do not slog sweep, cut instead", "Power comes from hip rotation on the knee", "Commit fully once the decision is made"], "equipment": ["Cricket balls", "Side-arm thrower (spin)", "Boundary markers"]}',
  '{"description": "Machine at 120kph, spin simulation. Slog sweep under pressure. Kinetic chain from kneeling: GFR through the front knee, hip rotation drives the bat. Despite being on one knee, the chain still applies. Bat speed measured — target is near-standing equivalent.", "coaching_points": ["GFR through front knee — yes, even kneeling", "Hip rotation is the primary power source in slog sweep", "Bat speed on a knee should be 85%+ of standing", "Match context: use against spin in powerplay or death overs", "Self-coach: where does the power come from when kneeling?"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar", "Boundary markers"]}',
  '{"description": "Slog Sweep Six-Off — 6 balls each, slog sweep only. Score 6 for boundary clearance, 0 for anything else. Bonus 3 for most aesthetically pleasing slog sweep (peer voted). Knockout format.", "scoring_rules": "6 for boundary clearance. 0 for anything else. Bonus 3 for best-looking shot (peer vote). 6 balls per round. Knockout.", "consequence": "First eliminated does a lap of the facility."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower (spin)", "Bowling machine (E tier)", "Bat speed radar", "Boundary markers"]',
  ARRAY['batting', 'slog sweep', 'power', 'spin', 'T20', 'six hitting', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 20. Upper Cut Club
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000020',
  'Upper Cut Club',
  'batting',
  'Short Ball / Wrists',
  'Upper cut over slip and point off short-pitched deliveries — using the pace of the ball and wrist angle to score behind square on the off side.',
  '{"description": "Underarm short-pitch feeds outside off. Batter opens the bat face and guides the ball over the slip area using an upper cut motion. Focus on wrist angle and using the pace of the ball.", "coaching_points": ["Open bat face early", "Get on top of the bounce — stand tall", "Wrist angle redirects the ball, do not hit", "Use the pace of the ball — the harder the better", "Aim over third man/slip area"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm short-pitch feeds with pace. Upper cut requires precise timing — too early and it goes to gully, too late and it is an edge behind. Focus on the exact contact point.", "coaching_points": ["Contact point is key — slightly behind the body", "Let the ball come to you, do not reach", "Late hands make this shot work", "Wrist position: open face, angled upward", "More pace on the ball = more runs for you"], "equipment": ["Cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine at 130-140kph, short of a length outside off. Upper cut at match pace. This shot uses the bowler''s pace against them. Kinetic chain is minimal — this is a redirection shot. Wrist speed and timing replace bat speed. Self-coach: why does more pace help?", "coaching_points": ["This shot inverts the kinetic chain — less effort = more runs", "Wrist speed replaces bat speed", "More pace from the bowler = more power in the upper cut", "Timing window is tiny at 140kph — pure instinct", "Self-coach: what would happen if you tried to muscle this shot?"], "equipment": ["Cricket balls", "Bowling machine"]}',
  '{"description": "Upper Cut Challenge — short balls outside off only. Runs over slip/third man count triple. Any shot not over third man area = 0. Getting out = -5. 12 balls each.", "scoring_rules": "Runs over third man area: triple value. Anywhere else = 0. Out = -5. 12 balls. Highest score wins.", "consequence": "Lowest scorer faces 6 balls of chin music next."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'upper cut', 'short ball', 'wrists', 'third man', 'T20', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 21. Chin Music
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000021',
  'Chin Music',
  'batting',
  'Short Ball Defence',
  'Duck, sway, pull, and hook off short-pitched deliveries — the full short-ball arsenal for T20 cricket.',
  '{"description": "Underarm short-pitch feeds. Batter practices 4 responses: duck, sway, pull, hook. Coach calls the response before each ball. Slow feeds to learn each body shape.", "coaching_points": ["Duck: bend knees, eyes on ball, bat out of way", "Sway: lean back from the hips, chin away from line", "Pull: front foot back and across, roll wrists", "Hook: get inside the line, control the shot", "All 4 options must be available for every short ball"], "equipment": ["Cricket balls", "Helmet (mandatory)"]}',
  '{"description": "Side-arm short-pitch with pace. Batter self-selects response based on line and height. Chin-high = duck/sway, rib-height = pull/hook. Shot selection is the skill being developed.", "coaching_points": ["Above shoulder: duck or sway — do not play a shot", "Rib height: pull or hook — scoring opportunity", "Between: hardest zone — decision must be instant", "Pull is safer, hook is riskier but scores faster", "Head position determines safety"], "equipment": ["Cricket balls", "Side-arm thrower", "Helmet (mandatory)"]}',
  '{"description": "Machine at 130-140kph, short pitch. Chin music at match pace. The batter''s primary job is survival and scoring. Decision speed is critical — late decisions against short balls at pace are dangerous. Self-coach: what was your decision process?", "coaching_points": ["Decision speed is a safety issue at this pace", "Late pull/hook at 140kph = danger", "If in doubt, duck — survival first", "Kinetic chain in the pull: back foot pivot, hip rotation, wrist roll", "Self-coach: did you decide before or during the delivery?"], "equipment": ["Cricket balls", "Bowling machine", "Helmet (mandatory)", "Chest guard"]}',
  '{"description": "Chin Music Survivor — short balls at increasing pace. 6 balls per round, pace increases each round. Getting hit = out. Caught = out. Miss = safe. Score from clean pulls/hooks. Last batter standing is champion.", "scoring_rules": "Clean pull/hook = runs. Getting hit = out. Caught = out. Duck/sway = safe (0 runs). Pace increases each round. Last standing wins.", "consequence": "Champion earns immunity from next consequence. All others do 15 push-ups."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Helmet (mandatory)", "Chest guard"]',
  ARRAY['batting', 'short ball', 'chin music', 'pull', 'hook', 'duck', 'sway', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 22. Soft Hands Circle
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000022',
  'Soft Hands Circle',
  'batting',
  'Touch / Control',
  'Dead-bat control within a restricted circle — developing soft hands, touch, and the ability to control the ball in tight situations.',
  '{"description": "Mark a 3m circle around the batter. Underarm feeds. Every shot must land within the circle — dead bat, soft hands, no power. Work on deceleration at contact. 12 balls per set.", "coaching_points": ["Grip pressure: light — 4/10 on the scale", "Hands give at contact — absorb, do not push", "Ball should drop at your feet, not travel", "Top hand controls, bottom hand relaxes", "This is how you defend in T20 — take the pace off"], "equipment": ["Cricket balls", "Cones for circle (3m radius)"]}',
  '{"description": "Side-arm feeds with pace. Soft hands circle remains 3m. More pace = harder to absorb. Batter must decelerate the bat at contact to keep the ball in the circle. Reduce circle to 2m for challenge.", "coaching_points": ["More pace requires softer hands — counterintuitive", "Hands must give MORE as pace increases", "Watch the ball onto the bat — contact point critical", "Bottom hand loosens at impact", "Circle shrinks to 2m — precision required"], "equipment": ["Cricket balls", "Side-arm thrower", "Cones for circle"]}',
  '{"description": "Machine at 120kph+. Soft hands at match pace. This is the most underrated T20 skill — the ability to take a single or defend when the field is set. Kinetic chain in reverse: instead of accelerating, the chain decelerates. Bat speed drops to near-zero at contact.", "coaching_points": ["Deceleration is a skill — kinetic chain in reverse", "Bat speed drops to near-zero at contact", "This skill wins matches: the ability to rotate strike", "High pace + soft hands = ultimate control", "Self-coach: what does your grip feel like at contact?"], "equipment": ["Cricket balls", "Bowling machine", "Cones for circle"]}',
  '{"description": "Soft Hands Duel — pair up, face-to-face, 3m circles. Fed alternately. Any ball leaving the circle = point to opponent. First to 10 points wins. Circle shrinks each round.", "scoring_rules": "Ball stays in circle = safe. Ball leaves circle = point to opponent. First to 10 points wins. Circle shrinks 50cm each round.", "consequence": "Loser must hit 6 consecutive slog sweeps (hardest drill for soft hands players)."}',
  15, 1,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Cones for circle"]',
  ARRAY['batting', 'soft hands', 'touch', 'control', 'defence', 'rotate strike', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- 23. Mishit Recovery
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0001-4000-8000-000000000023',
  'Mishit Recovery',
  'batting',
  'Resilience / Scramble',
  'Scoring off edges and mishits — developing the scramble ability and resilience to score even when the execution is imperfect.',
  '{"description": "Deliberately feed balls that create mishits — wide, short, angled. Batter must score runs from every ball regardless of contact quality. Focus: running between wickets, placement of mishits.", "coaching_points": ["Not every ball will middle — accept that", "Edges and thick inside edges can score runs", "Run on mishits — put pressure on the fielder", "Placement of mishits: try to guide them into gaps", "Attitude: mishit is not failure, it is an opportunity"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm varied feeds designed to create imperfect contact. Batter scores from edges, top edges, inside edges. Mix in good balls to reset. Emphasis on running between wickets on anything that goes to ground.", "coaching_points": ["Top edge: can score over keeper if wrists adjust", "Inside edge: use to score fine leg", "Thick outside edge: runs through gully/point", "Call loudly and run hard on mishits", "Scramble runs win T20 matches"], "equipment": ["Cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine at match pace. Varied lines and lengths creating natural mishits. Score from everything. T20 elite skill: best batters in the world score 30% of their runs from imperfect contact. Self-coach: analyse your mishit patterns — where do your edges go?", "coaching_points": ["Elite batters score 30% from mishits", "Mishit pattern analysis: where do edges go?", "Use mishit patterns to manipulate field positions", "Controlled mishits are a skill — guide the edge", "Self-coach: map your personal mishit zones"], "equipment": ["Cricket balls", "Bowling machine"]}',
  '{"description": "Mishit Masters — only runs from edges, mishits count DOUBLE. Cleanly middled shots count single. 12 balls each. Best total wins. Encourages embracing imperfection.", "scoring_rules": "Mishit/edge runs count double. Cleanly middled runs count normal. 12 balls. Highest total wins.", "consequence": "Lowest scorer must face next drill using a narrow bat (stump instead of bat for 3 balls)."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'mishit', 'recovery', 'scramble', 'resilience', 'edges', 'T20', 'skill acquisition'],
  3, 'Running 3s between sets', TRUE
);

-- ============================================================
-- SKILL EXPANSION — Open Skills / Decision-Making Drills (16)
-- ============================================================

-- 24. 9 Pin Bowling
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000001',
  '9 Pin Bowling',
  'batting',
  'Stump Protection',
  'Protecting multiple stumps while scoring — developing defensive awareness alongside scoring intent.',
  '{"description": "Set 9 stumps/pins behind the batter. Underarm feeds. Batter must score runs while protecting all 9 pins. Any pin knocked over = out. Focus on shot selection that avoids exposing stumps.", "coaching_points": ["Straighter shots protect the stumps better", "Cross-bat shots expose the stumps — use sparingly", "Balance between attack and defence", "Watch the ball — edges knock over pins", "Leave balls that could deflect into pins"], "equipment": ["Cricket balls", "9 stumps or pins", "Cones"]}',
  '{"description": "Side-arm feeds at pace. 9 pins behind. Score runs while protecting. Faster pace means more risk of deflections into pins. Shot selection becomes critical — cannot just defend.", "coaching_points": ["Pace amplifies the deflection risk", "Play with soft hands to reduce deflection power", "Choose scoring zones that angle away from pins", "Leave anything that threatens the pins", "Count remaining pins — awareness of what is at risk"], "equipment": ["Cricket balls", "Side-arm thrower", "9 stumps or pins"]}',
  '{"description": "Machine at match pace. 9 pins. Must score at a run rate of 8+ while keeping all pins alive. Simulates batting with the tail — must protect the other end while scoring. Decision speed and shot selection under pressure.", "coaching_points": ["Match simulation: batting with lower-order partner", "Protect the stumps (partner) while scoring", "Run rate pressure forces risky shots — manage the tension", "Decision speed: identify safe scoring areas instantly", "Self-coach: what shots can you play without exposing the pins?"], "equipment": ["Cricket balls", "Bowling machine", "9 stumps or pins"]}',
  '{"description": "9 Pin Survivor — each batter starts with 9 pins. Lose a pin = -5 runs. Score normally. Play 2 overs. Most net runs wins. Adds constant pressure to protect while scoring.", "scoring_rules": "Score runs normally. Each pin lost = -5 runs. Play 2 overs (12 balls). Net runs (total runs minus pin penalties) wins.", "consequence": "Most pins lost = 10 burpees per pin lost."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "9 stumps or pins"]',
  ARRAY['batting', 'stump protection', 'decision making', 'shot selection', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 25. Imposters
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000002',
  'Imposters',
  'tactical',
  'Deception / Game Sense',
  'Secret target scoring with group deduction — one batter has a secret scoring zone, others must identify it through observation.',
  '{"description": "One batter is given a secret target zone (e.g., cover, midwicket). They must score as many runs as possible into that zone without others guessing. Underarm feeds. Group watches and guesses after each set.", "coaching_points": ["Disguise your intent — do not telegraph the zone", "Body position must look natural for all shots", "Vary your other shots to create deception", "Observers: watch feet, head, and shoulder position for clues", "Deception is a batting skill"], "equipment": ["Cricket balls", "Zone cards (secret)"]}',
  '{"description": "Side-arm feeds. Secret zone batter must score in their zone while actively deceiving observers. Observers get one guess after each over. If guessed correctly, imposter is out. Adds cognitive load to both batter and observers.", "coaching_points": ["Higher pace makes deception harder", "Pre-shot routine must be consistent regardless of intent", "Observers: look for patterns over 6 balls", "Imposter: deliberately play other zones to confuse", "Game sense: reading opponents is a cricket skill"], "equipment": ["Cricket balls", "Side-arm thrower", "Zone cards"]}',
  '{"description": "Machine at pace. Imposter must score in secret zone under match pressure while maintaining deception. This develops the elite skill of disguised intent — the best T20 batters look like they are playing one shot but redirect at the last moment.", "coaching_points": ["Elite skill: disguised intent at the crease", "Best T20 batters redirect at the last millisecond", "Body position commits one way, wrists redirect another", "This is the difference between good and elite placement", "Self-coach: how did you disguise your intent?"], "equipment": ["Cricket balls", "Bowling machine", "Zone cards"]}',
  '{"description": "Among Us Cricket — 2 imposters in a group of 6. Imposters have secret zones. After each over, group votes on who the imposter is. Wrong vote = imposter scores bonus. Correct vote = imposter eliminated.", "scoring_rules": "Imposters score in secret zone. Group votes after each over. Wrong vote = +10 to imposter. Correct vote = imposter out. Surviving imposters win.", "consequence": "Incorrectly accused batters sit out for 1 over."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Zone cards"]',
  ARRAY['batting', 'deception', 'game sense', 'tactical', 'imposters', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 26. Dice Roll
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000003',
  'Dice Roll',
  'batting',
  'Decision Making',
  'Random shot type assignment via dice roll — removing pre-selection and forcing adaptability under constraint.',
  '{"description": "Roll a dice before each ball. 1=drive, 2=cut, 3=pull, 4=sweep, 5=loft, 6=free choice. Underarm feeds. Batter must execute the assigned shot regardless of ball length. Develops full shot range.", "coaching_points": ["Every shot must be in your repertoire", "Adapting a shot to an awkward length is a skill", "Drive a short ball? Find a way", "Sweep a full ball? Get creative", "Free choice: show your best shot"], "equipment": ["Cricket balls", "Large dice"]}',
  '{"description": "Side-arm feeds with dice roll. Pace added. Must execute assigned shot at higher tempo. If the dice shot is impossible for the delivery, batter loses a point. Forces creative problem-solving.", "coaching_points": ["Creative problem-solving under pressure", "Some combinations are very hard — that is the point", "Expand your shot options for every length", "Think about HOW to make an awkward combination work", "Failure is learning — there is no wrong answer"], "equipment": ["Cricket balls", "Side-arm thrower", "Large dice"]}',
  '{"description": "Machine at pace with dice roll. Execute assigned shot at match pace. Elite adaptation: can you pull a full ball? Can you drive a short ball? These situations happen in matches — be ready. Self-coach: which combination was hardest and why?", "coaching_points": ["In matches, you do not choose the delivery", "Adapting your shot to the situation is elite", "Hardest combinations expose technique gaps", "T20 demands: you must score from every ball", "Self-coach: which dice combo challenged you most?"], "equipment": ["Cricket balls", "Bowling machine", "Large dice"]}',
  '{"description": "Dice Roll Derby — score runs with assigned shots. Perfect execution of dice shot = runs count double. Wrong shot played = 0. 18 balls (3 overs). Highest total wins.", "scoring_rules": "Correct dice shot executed: runs double. Wrong shot = 0 runs. 18 balls. Highest total wins.", "consequence": "Lowest scorer chooses 6 consecutive dice rolls for next batter (strategic revenge)."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Large dice"]',
  ARRAY['batting', 'decision making', 'adaptability', 'dice', 'shot range', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 27. Red Ball White Ball
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000004',
  'Red Ball White Ball',
  'batting',
  'Colour Recognition',
  'Colour-cued attack/defend decisions — red ball means defend, white ball means attack. Develops pre-programmed decision-making.',
  '{"description": "Mix red and white balls in the feed bucket. Underarm feeds. Red ball = defend (soft hands, no runs). White ball = attack (maximum intent). Batter must recognise colour early and commit to the response.", "coaching_points": ["Identify colour during the flight, not after bounce", "Red = soft hands, dead bat, protect", "White = full swing, attack, score runs", "Transition between modes must be instant", "Pre-programme the response to each colour"], "equipment": ["Red cricket balls", "White cricket balls"]}',
  '{"description": "Side-arm feeds mixing red and white at pace. Faster delivery = less time to identify colour and select response. Add complexity: occasionally show a pink ball = rotate strike (run a single).", "coaching_points": ["Colour identification window shrinks with pace", "Train the eyes to pick up colour early", "Pink ball adds a third response option", "Transition speed between attack/defend = key metric", "Do not freeze — commit to a response"], "equipment": ["Red cricket balls", "White cricket balls", "Pink cricket balls (optional)", "Side-arm thrower"]}',
  '{"description": "Machine alternating red and white at 130kph. Decision time is less than 0.3 seconds. This simulates the match decision of when to attack vs when to defend — it must be pre-programmed. Self-coach: how early did you identify the colour?", "coaching_points": ["At 130kph, you have 0.3 seconds to decide", "Pre-programming decisions is essential", "In matches: identify scoring ball vs good ball early", "Colour recognition = length/line recognition", "Self-coach: could you identify before or after release?"], "equipment": ["Red cricket balls", "White cricket balls", "Bowling machine"]}',
  '{"description": "Traffic Light Cricket — red=defend, white=attack, pink=single. Wrong response = out. Score normally on correct responses. 2 overs per batter. Highest score with fewest incorrect responses wins.", "scoring_rules": "Correct response: runs count. Wrong response: out. 2 overs per batter. Highest score wins. Tiebreak: fewer wrong responses.", "consequence": "Most wrong responses does 10 shuttle runs."}',
  15, 2,
  '["Red cricket balls", "White cricket balls", "Pink cricket balls (optional)", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'decision making', 'colour recognition', 'attack', 'defend', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 28. Blind Batting
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000005',
  'Blind Batting',
  'batting',
  'Trust / Instinct',
  'Reduced vision batting — trusting hands, instinct, and proprioception when visual information is limited.',
  '{"description": "Batter wears a cap pulled low or uses blacked-out glasses. Underarm feeds. Must make contact using feel and sound. Start with eyes fully open then progressively reduce vision. 6 balls per level.", "coaching_points": ["Listen for the ball — sound cues help", "Hands know where the bat is — trust them", "Stance and balance become critical without vision", "Muscle memory must take over", "Start with partial vision, progress to minimal"], "equipment": ["Cricket balls", "Blacked-out glasses or cap", "Soft balls (for safety)"]}',
  '{"description": "Side-arm feeds with restricted vision. Batter has peripheral vision only (tape over centre of glasses). Must use body feel and sound to time the shot. Coach calls length to help initially, then removes the call.", "coaching_points": ["Peripheral vision catches movement, not detail", "Body position and balance replace visual precision", "Sound of the ball off the pitch gives timing cues", "When coach stops calling length, trust your instinct", "Notice how much you normally rely on vision"], "equipment": ["Cricket balls", "Modified glasses/cap", "Side-arm thrower"]}',
  '{"description": "Side-arm at moderate pace with minimal vision. Elite drill: develops the subconscious skill processing that elite batters use. The conscious mind cannot process at 140kph — the subconscious must take over. This drill trains that handoff. Self-coach: what felt different about your timing?", "coaching_points": ["At elite pace, the conscious mind is too slow", "Subconscious processing handles most of the timing", "This drill forces the subconscious to take over", "Feel-based batting is what separates good from great", "Self-coach: describe what you felt vs what you saw"], "equipment": ["Cricket balls", "Modified glasses", "Side-arm thrower"]}',
  '{"description": "Blind Batting Challenge — progressive vision reduction. Round 1: full vision. Round 2: peripheral only. Round 3: nearly blind. Score runs at each level. Total across all 3 rounds wins. Bonus for clean contact in round 3.", "scoring_rules": "Round 1 (full): normal runs. Round 2 (peripheral): runs x2. Round 3 (nearly blind): runs x3. 6 balls per round. Total wins.", "consequence": "Lowest scorer wears blacked-out glasses for next drill warm-up."}',
  15, 1,
  '["Cricket balls", "Blacked-out glasses or modified cap", "Soft balls (for safety)", "Side-arm thrower"]',
  ARRAY['batting', 'blind', 'instinct', 'trust', 'proprioception', 'subconscious', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 29. Distractions
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000006',
  'Distractions',
  'batting',
  'Focus Under Pressure',
  'Maintaining technique under cognitive load — batting while distractions test concentration and mental resilience.',
  '{"description": "Underarm feeds while coach talks to the batter (asks questions, gives random instructions). Batter must make contact while answering or ignoring distractions. Light-hearted but teaches focus.", "coaching_points": ["Ignore irrelevant information", "Focus on the ball, not the noise", "Develop a trigger to refocus between balls", "Breathing: deep breath before each delivery", "Practice your pre-ball routine"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm feeds with multiple distractions: music, talking, teammates heckling, visual distractions (someone walking across eyeline). Batter must maintain quality shots despite cognitive overload.", "coaching_points": ["Match simulation: crowds, fielders, chatter", "Your pre-ball routine is your anchor", "Do not engage with distractions — notice and return to focus", "Quality of shots must not drop despite noise", "If distracted: step away, reset, go again"], "equipment": ["Cricket balls", "Side-arm thrower", "Bluetooth speaker", "Distracting props"]}',
  '{"description": "Machine at pace with full distraction suite: loud music, teammates in eyeline, coach asking maths questions between balls. Must maintain bat speed and shot quality. Self-coach: what was hardest to ignore? What helped you refocus?", "coaching_points": ["At match pace, distraction tolerance is a survival skill", "Bat speed must not drop — if it does, distraction won", "The crowd noise in a T20 final is louder than this", "Build your bubble: eyes-breath-trigger-ball", "Self-coach: rate your focus 1-10 on each ball"], "equipment": ["Cricket balls", "Bowling machine", "Bluetooth speaker", "Bat speed radar"]}',
  '{"description": "Distraction Survivor — group assigns distractions to each batter (escalating difficulty). Score normally but bat speed measured. Any bat speed drop >15% = lost focus penalty (-3 runs). Most resilient batter wins.", "scoring_rules": "Score runs normally. Bat speed drop >15% from baseline = -3 runs per ball. Most net runs after 12 balls wins.", "consequence": "Most distracted batter (most -3 penalties) leads next warm-up."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Bluetooth speaker", "Bat speed radar"]',
  ARRAY['batting', 'focus', 'concentration', 'distractions', 'mental', 'pressure', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 30. 4 Colours Hitting
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000007',
  '4 Colours Hitting',
  'batting',
  'Reaction / Processing',
  'Multi-colour response identification — each colour ball demands a different shot response, developing rapid cognitive processing.',
  '{"description": "Use 4 different coloured balls (red, white, pink, yellow). Each colour = specific shot. Red=drive, White=cut, Pink=pull, Yellow=sweep. Underarm feeds mixing colours. Identify colour and execute correct shot.", "coaching_points": ["Identify colour in flight — before bounce", "Each colour triggers a specific motor program", "Wrong shot = failure to identify colour early", "Speed of identification improves with practice", "Start slow, increase feed tempo gradually"], "equipment": ["Red cricket balls", "White cricket balls", "Pink cricket balls", "Yellow cricket balls"]}',
  '{"description": "Side-arm feeds mixing 4 colours at pace. Less time to identify = more errors initially. Track improvement over sets. Add: wrong colour shot = out. Correct colour + good shot = 6.", "coaching_points": ["Colour identification speed is the bottleneck", "At pace, you have milliseconds to read colour", "Wrong shots should decrease over sets", "Track your error rate: set 1 vs set 3", "This trains the same skill as reading a bowler''s hand"], "equipment": ["Multi-coloured cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine alternating colours at match pace. At 130kph, identification window is 0.2 seconds. This mirrors reading a bowler''s wrist position, seam angle, and release point in real matches. Self-coach: how does this relate to reading a spinner?", "coaching_points": ["0.2 seconds to identify = same as reading a bowler", "Wrist position, seam angle, release = colour in this drill", "Train the brain to process faster", "Error rate at pace reveals processing speed ceiling", "Self-coach: connect colour reading to bowler reading"], "equipment": ["Multi-coloured cricket balls", "Bowling machine"]}',
  '{"description": "Colour Rush — increasing speed. Round 1: slow feeds. Round 2: medium. Round 3: fast. Score from correct-colour shots only. Wrong colour = -2. Track error rate improvement across rounds.", "scoring_rules": "Correct colour + correct shot: runs count. Wrong colour = -2. 6 balls per round, 3 rounds. Total score wins.", "consequence": "Most errors = ball-fetching duty for next drill."}',
  15, 2,
  '["Multi-coloured cricket balls (red, white, pink, yellow)", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'reaction', 'processing', 'colours', 'decision making', 'cognitive', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 31. Slot Ball
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000008',
  'Slot Ball',
  'batting',
  'Shot Selection / Patience',
  'Attack only the bad ball, defend the rest — developing the patience and selectivity required in T20 middle overs.',
  '{"description": "Underarm feeds mixing good-length and bad balls (half volleys, short and wide). Batter must defend good balls softly and attack bad balls aggressively. Coach counts correct decisions.", "coaching_points": ["Not every ball is a scoring ball — accept that", "Good length: soft hands, dead bat, survive", "Bad ball: maximum intent, full swing", "The switch from defend to attack must be instant", "Patience is an attacking weapon"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm feeds with 70% good balls, 30% bad balls. Batter must identify and punish the bad balls while surviving the good ones. Decision accuracy tracked by coach.", "coaching_points": ["70/30 ratio mirrors actual match bowling", "Bad ball recognition speed is the skill", "Do not force shots on good balls", "When the bad ball comes, do not waste it", "Track your conversion rate: bad balls scored from / total bad balls"], "equipment": ["Cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine at match pace. Random mix of good and bad balls. At 130kph, the batter has 0.3 seconds to identify good vs bad AND commit to the correct response. This is the elite skill of shot selection. Self-coach: what cues told you it was a bad ball?", "coaching_points": ["At pace, slot ball identification is subconscious", "Length cue: release point + trajectory = instant read", "Scoring rate comes from punishing bad balls, not forcing good ones", "Elite batters have 90%+ bad ball conversion rate", "Self-coach: describe your decision process for each ball"], "equipment": ["Cricket balls", "Bowling machine"]}',
  '{"description": "Slot Ball Challenge — defend good balls (if ball goes more than 2m = out). Attack bad balls (score runs). Best net score over 18 balls wins. Penalises forcing good balls and wasting bad balls.", "scoring_rules": "Good ball travels >2m = out. Good ball defended = safe. Bad ball scored = runs. Bad ball defended = -2 (wasted opportunity). 18 balls.", "consequence": "Worst shot selection percentage does 20 sit-ups."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'shot selection', 'patience', 'slot ball', 'decision making', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 32. Death Over Auction
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000009',
  'Death Over Auction',
  'tactical',
  'Chase / Pressure',
  'Target chase with scoreboard pressure — simulating death-over batting with required run rates and consequences.',
  '{"description": "Set a target: need 15 off 12 balls. Underarm feeds. Batter must manage the chase — score enough without getting out. Scoreboard visible. Simple target to start, builds awareness of run rate.", "coaching_points": ["Know your target: runs needed per ball", "Plan your scoring: which balls to attack?", "Do not panic — 15 off 12 is achievable", "Dot balls increase pressure — rotate strike", "Think ahead: if I score 4 here, what does that leave?"], "equipment": ["Cricket balls", "Scoreboard/whiteboard"]}',
  '{"description": "Side-arm feeds. Harder targets: 22 off 12, or 36 off 18. Scoreboard updates live. Add consequences for failure. Field set shown — must score around the field. Pressure increases as balls decrease.", "coaching_points": ["Higher required rate demands risk assessment", "Which balls to target for boundaries?", "Calculate: how many dots can I afford?", "Field awareness: where are the gaps?", "Communication if batting in pairs"], "equipment": ["Cricket balls", "Side-arm thrower", "Scoreboard"]}',
  '{"description": "Machine at match pace. Death over simulation: need 18 off 6 balls. Yorkers, slower balls, bouncers mixed in. Full match pressure. This is the highest-pressure batting scenario in T20. Self-coach: what was your plan? Did you stick to it?", "coaching_points": ["18 off 6 = 3 boundaries needed. Plan accordingly.", "Pre-meditate first 2 balls then react", "Yorkers: helicopter or scoop. Slower balls: wait and drive", "Bouncers: pull or leave — do not waste energy", "Self-coach: did the plan survive contact with the bowling?"], "equipment": ["Cricket balls", "Bowling machine", "Scoreboard"]}',
  '{"description": "Death Over Auction — batters bid on targets. Higher target = more reward if achieved. Bid 12 off 6 (easy, 1 point). Bid 24 off 6 (hard, 5 points). Fail = minus the bid points. Highest total after 3 rounds.", "scoring_rules": "Bid on target difficulty: easy (1pt), medium (3pt), hard (5pt). Achieve target = earn points. Fail = lose bid points. 3 rounds.", "consequence": "Negative total after 3 rounds = 1 lap of the facility per negative point."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Scoreboard/whiteboard"]',
  ARRAY['batting', 'death overs', 'chase', 'pressure', 'scoreboard', 'tactical', 'T20', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 33. Powerplay Blitz
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000010',
  'Powerplay Blitz',
  'batting',
  'Attacking Intent',
  '360-degree attacking with field awareness — simulating powerplay overs where only 2 fielders are outside the circle.',
  '{"description": "Underarm feeds. Show a powerplay field (2 out). Batter must score 360 degrees, exploiting the gaps in the restricted field. Minimum intent: 4 every ball. No blocking allowed.", "coaching_points": ["Powerplay = 2 fielders out. Gaps everywhere.", "Score 360 degrees — do not get stuck hitting one area", "Minimum intent is 4 — boundary every ball", "Read the field: where are the 2 outside fielders?", "Exploit the gaps behind square — no one there"], "equipment": ["Cricket balls", "Field placement chart/cones"]}',
  '{"description": "Side-arm feeds with powerplay field shown. Scoring intent must be high. Coach moves field between overs — batter must adapt. Strike rate target: 150+.", "coaching_points": ["Field moves — your scoring areas move with it", "Read the field BEFORE the ball is bowled", "Pre-meditate based on field, react based on delivery", "If both outside fielders are leg side, hit off side", "Strike rate 150+ in powerplay is the benchmark"], "equipment": ["Cricket balls", "Side-arm thrower", "Field chart"]}',
  '{"description": "Machine at pace with powerplay field shown. Full match simulation: 6 balls = 1 powerplay over. Target: 12+ runs per over. Self-coach: explain field reading, scoring plan, and execution.", "coaching_points": ["12+ per over in powerplay = match-winning", "Field reading must happen between balls, not during", "Plan A and Plan B for each field set", "GFR and kinetic chain at full power — powerplay is attack", "Self-coach: what was your plan for that field?"], "equipment": ["Cricket balls", "Bowling machine", "Field chart"]}',
  '{"description": "Powerplay Blitz — 6-ball overs with scoreboard. Need 12+ per over. Bonus point for each over achieving 12+. Getting out = -10 runs. 3 overs per batter. Highest total wins.", "scoring_rules": "Score runs normally. 12+ in an over = bonus 5 points. Getting out = -10. 3 overs per batter. Total wins.", "consequence": "Lowest total fields for 20 minutes (ball retrieving)."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Field placement chart", "Scoreboard"]',
  ARRAY['batting', 'powerplay', 'attacking', '360', 'field awareness', 'T20', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 34. Relay Runners
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000011',
  'Relay Runners',
  'batting',
  'Running / Communication',
  'Pairs running, calling, and turning — developing between-wicket running efficiency and communication.',
  '{"description": "Pairs practice calling and running between wickets. No batting — just running. Coach hits ball into gaps, pair must run appropriate number. Focus on: call loudly, respond immediately, turn tightly.", "coaching_points": ["Caller is the one FACING the ball", "Call loudly: YES/NO/WAIT — nothing else", "First 3 steps are explosive — fast out of the crease", "Turn: bat in the leading hand, low turn", "Ground the bat, do not dive unnecessarily"], "equipment": ["Cricket bat", "Stumps at both ends"]}',
  '{"description": "Pairs batting: hit then run. Must run on every ball (no dots). Coach tracks run-out opportunities. Emphasis on calling before the ball reaches the fielder, not after.", "coaching_points": ["Call BEFORE the ball reaches the fielder", "Back-up: non-striker walks forward during delivery", "Judgement: can we get 2? Communicate instantly", "Turn at the non-striker end: who calls for the second?", "Lazy running between wickets = match-losing habit"], "equipment": ["Cricket balls", "Stumps", "Side-arm thrower"]}',
  '{"description": "Match simulation: pairs batting with live fielders. Overthrows and misfields are real. Running under match pressure with consequences for run-outs. Target: 0 run-out opportunities given. Self-coach: rate your communication 1-10.", "coaching_points": ["Run-outs are the most preventable dismissal", "Communication quality = run-out risk reduction", "Elite pairs: 0 run-out chances given per innings", "Overthrows: be alert for the extra run", "Self-coach: rate calling, turning, and responsiveness"], "equipment": ["Cricket balls", "Full fielding setup", "Stumps"]}',
  '{"description": "Relay Race Runs — pairs compete. 30 balls each pair. Most runs (including extras for tight running). Any run-out = -10 runs. Run-out attempt that fails = bonus 2 runs (pressure on fielders).", "scoring_rules": "Score runs normally. Run-out = -10. Failed run-out attempt by fielder = +2 bonus. 30 balls per pair. Most runs wins.", "consequence": "Pair with fewest runs does a relay sprint race against the winners."}',
  15, 2,
  '["Cricket balls", "Stumps", "Side-arm thrower"]',
  ARRAY['batting', 'running', 'communication', 'pairs', 'between wickets', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 35. Partnership Powerplay
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000012',
  'Partnership Powerplay',
  'tactical',
  'Pairs / Rotation',
  'Pairs batting with role assignment — one batter is the anchor, the other is the attacker. Develops partnership awareness.',
  '{"description": "Pairs bat together. Before the session, assign roles: anchor (strike rate 100) and attacker (strike rate 150+). Underarm feeds alternating between the pair. Coach tracks individual and partnership stats.", "coaching_points": ["Anchor: rotate strike, build the platform", "Attacker: boundaries, maximise scoring balls", "Communication between partners about intent", "Role clarity: both know their job", "Partnership is greater than individual"], "equipment": ["Cricket balls", "Scoreboard"]}',
  '{"description": "Side-arm feeds with roles. Add complexity: switch roles mid-innings. Anchor becomes attacker and vice versa. Tests versatility and the ability to change gears within a partnership.", "coaching_points": ["Gear change: can the anchor turn on aggression?", "Gear change: can the attacker dial it back?", "Communication: agree the switch point together", "Read the match situation: when to switch?", "Versatile partnerships win tournaments"], "equipment": ["Cricket balls", "Side-arm thrower", "Scoreboard"]}',
  '{"description": "Machine at pace. Full match scenario: target to chase, roles assigned. Roles may switch based on match situation (e.g., anchor gets out, new batter takes anchor role). Self-coach: evaluate the partnership dynamic.", "coaching_points": ["Match situation dictates roles — not preference", "If anchor falls, new batter must assess and adapt", "Elite partnerships: unspoken understanding", "Run rate awareness is both batters'' responsibility", "Self-coach: how well did you communicate as a pair?"], "equipment": ["Cricket balls", "Bowling machine", "Scoreboard"]}',
  '{"description": "Partnership Wars — pairs bat 5 overs. Partnership runs count. Anchor can only score singles (1s, 2s, 3s). Attacker can score boundaries. Both can get out. Best partnership total wins.", "scoring_rules": "Anchor: only 1s, 2s, 3s (boundaries reduced to 3). Attacker: all runs count. Both can get out (-10 each). 5 overs per pair. Best total.", "consequence": "Losing pair carries equipment back to the storage."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Scoreboard"]',
  ARRAY['batting', 'partnership', 'pairs', 'rotation', 'anchor', 'attacker', 'tactical', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 36. Middle Overs Masterclass
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000013',
  'Middle Overs Masterclass',
  'tactical',
  'Placement / Rotation',
  'Spin play with field manipulation — developing the ability to score consistently through the middle overs (7-15) against spin.',
  '{"description": "Underarm spin feeds. Show a middle-overs field set (5 out). Batter must rotate strike and find boundaries against spin with this field. Target strike rate: 120-140.", "coaching_points": ["Middle overs: 5 fielders outside the circle", "Rotate strike: 1s and 2s are valuable", "Find the boundary: slog sweep, inside out, advance", "Do not get bogged down — dot balls kill momentum", "Read the spinner: which way is it turning?"], "equipment": ["Cricket balls", "Field chart", "Scoreboard"]}',
  '{"description": "Side-arm spin feeds with field manipulation. Coach changes field every over. Batter must identify new gaps and adjust scoring plan. Target: 7-8 runs per over.", "coaching_points": ["Field changes = scoring plan changes", "Identify new gaps before the ball is bowled", "7-8 runs per over in middle overs is elite", "Mix boundaries with rotation", "Sweep/slog sweep when deep fielder is straight"], "equipment": ["Cricket balls", "Side-arm thrower (spin)", "Field chart", "Scoreboard"]}',
  '{"description": "Live spin or machine simulating spin at match pace. Full middle-overs simulation. 6 overs, field changes each over. Self-coach: evaluate your scoring plan for each field set. Did you adapt quickly enough?", "coaching_points": ["Middle overs are won by intelligent batting", "Plans must change over by over as fields adjust", "Elite: score at 130+ vs spin with 5 out", "Decision tree: advance, sweep, work gaps, or defend", "Self-coach: what was your plan for each field? Did it work?"], "equipment": ["Cricket balls", "Bowling machine or spinner", "Field chart", "Scoreboard"]}',
  '{"description": "Middle Overs Challenge — 6 overs per batter with changing fields. Score 7+ per over = bonus point. Score 5 or less = penalty point. Dot ball = -1 run. Total score + bonuses - penalties decides winner.", "scoring_rules": "Score normally. 7+ per over = +3 bonus. 5 or less = -3 penalty. Dot ball = -1 extra. 6 overs. Total wins.", "consequence": "Lowest scorer leads the next warm-up session."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower (spin)", "Bowling machine (E tier)", "Field chart", "Scoreboard"]',
  ARRAY['batting', 'middle overs', 'spin', 'rotation', 'placement', 'tactical', 'T20', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 37. Fatigue Finisher
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000014',
  'Fatigue Finisher',
  'batting',
  'Fitness / Composure',
  'Batting technique under physical fatigue — developing the ability to execute skills when the body is tired.',
  '{"description": "10 burpees or shuttle runs, then immediately face 6 underarm feeds. Track shot quality vs rested baseline. Repeat 3 sets. Focus: can technique survive fatigue?", "coaching_points": ["Fatigue degrades technique — identify what goes first", "Breathing: recover between exercise and batting", "Stance and balance are the first casualties", "Head position: most common fatigue error", "Know your fatigue threshold"], "equipment": ["Cricket balls", "Cones for shuttles"]}',
  '{"description": "Higher-intensity exercise between sets: 15 burpees or 20m sprints x3, then face side-arm feeds. Shot quality must remain above 70% of baseline. Coach tracks degradation pattern.", "coaching_points": ["70% quality threshold under fatigue", "Identify YOUR personal fatigue pattern", "Does your footwork go first? Head position? Grip?", "Recovery strategies: breathing, reset routine", "In matches, the 18th over batter is always fatigued"], "equipment": ["Cricket balls", "Side-arm thrower", "Cones"]}',
  '{"description": "Full fitness session (sprints, burpees, core work) then machine at match pace. Bat speed measured: track degradation. If bat speed drops >20%, technique has failed under fatigue. This simulates late-innings batting after 40+ minutes at the crease.", "coaching_points": ["Bat speed degradation = fatigue impact measured", "20% drop threshold — below this, you are a liability", "Kinetic chain under fatigue: which link fails?", "In T20, death-over batting is always under fatigue", "Self-coach: what was the first thing to fail?"], "equipment": ["Cricket balls", "Bowling machine", "Bat speed radar", "Cones"]}',
  '{"description": "Fatigue Wars — increasing exercise intensity between sets. Round 1: 5 burpees. Round 2: 10. Round 3: 15. Score runs after each round. Track score degradation. Least degradation wins.", "scoring_rules": "Score runs after each exercise round. Track degradation: Round 3 score / Round 1 score ratio. Best ratio wins. Tiebreak: total runs.", "consequence": "Worst degradation ratio does an extra fitness circuit."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Bat speed radar", "Cones for shuttles"]',
  ARRAY['batting', 'fatigue', 'fitness', 'composure', 'technique under pressure', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 38. IPL Auction
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000015',
  'IPL Auction',
  'batting',
  'Pre-Meditation / Commitment',
  'Pre-committed shot selection — batter announces the shot they will play before seeing the delivery, then must execute it regardless.',
  '{"description": "Batter announces their shot before each ball (e.g., cover drive). Underarm feeds. Must execute that exact shot regardless of length or line. Develops commitment and the ability to manufacture shots.", "coaching_points": ["Announce clearly: name the shot", "Commit 100% — do not change mid-delivery", "Manufacturing a cover drive off a short ball is a skill", "Some ball-shot combos are very hard — that is the learning", "Commitment is the key: half measures fail"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm feeds with pre-committed shots. Announce before each ball. Must execute at pace. If the delivery suits the shot, it should be quality. If not, the batter must problem-solve.", "coaching_points": ["At pace, commitment must be even stronger", "Pre-commitment removes indecision", "Some T20 batters pre-meditate every ball", "The risk: what if the ball does not suit the shot?", "Solution: adapt the shot to the ball, not abandon it"], "equipment": ["Cricket balls", "Side-arm thrower"]}',
  '{"description": "Machine at match pace. Batter pre-commits to every shot. At 130kph, if you have already decided, you have MORE time to execute because the decision is already made. Self-coach: compare the feeling of pre-committed vs reactive batting.", "coaching_points": ["Pre-commitment removes decision time — more time for execution", "At pace, decision speed matters more than reaction speed", "Pre-meditated shots at 130kph feel like they are in slow motion", "Elite T20: top batters pre-meditate 40-60% of their shots", "Self-coach: did it feel easier or harder than reactive batting?"], "equipment": ["Cricket balls", "Bowling machine"]}',
  '{"description": "IPL Auction — batters auction for their shot selection. Bid high for easy shots (drive on full ball = expensive). Bid low for hard combos (drive on bouncer = cheap). Points proportional to difficulty. 12 balls per batter.", "scoring_rules": "Easy combo (shot suits delivery): 1 point. Medium combo: 3 points. Hard combo: 5 points. Failed execution: 0. 12 balls. Total points wins.", "consequence": "Lowest scorer is auctioned to pick up balls for next drill."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)"]',
  ARRAY['batting', 'pre-meditation', 'commitment', 'shot selection', 'T20', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- 39. Reverse Roles
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0002-4000-8000-000000000016',
  'Reverse Roles',
  'batting',
  'Versatility / Growth',
  'Playing the opposite of your natural style — power hitters must accumulate, accumulators must hit boundaries.',
  '{"description": "Identify each batter''s natural style (power hitter or accumulator). Assign the opposite role. Underarm feeds. Power hitters: only singles allowed. Accumulators: only boundaries allowed.", "coaching_points": ["Power hitters: learn patience, placement, soft hands", "Accumulators: commit to hitting over the top", "Both skills are needed in T20 — you must be versatile", "Discomfort is the learning zone", "Notice what feels hardest about the opposite role"], "equipment": ["Cricket balls"]}',
  '{"description": "Side-arm feeds in reverse roles. Must maintain the opposite style for an entire 3-over innings. Coach tracks: did the power hitter manage to accumulate? Did the accumulator hit boundaries?", "coaching_points": ["3 overs in the uncomfortable role", "Power hitters: can you score 18 off 18 in 1s and 2s?", "Accumulators: can you clear the boundary 3 times?", "The skills you develop here make you complete", "Versatility wins selection — specialists get dropped"], "equipment": ["Cricket balls", "Side-arm thrower", "Scoreboard"]}',
  '{"description": "Machine at pace in reverse roles. The ultimate test: can a power hitter accumulate at 130kph? Can an accumulator clear the boundary at 130kph? Both are required in T20. Self-coach: what did the opposite role teach you about your natural game?", "coaching_points": ["Reverse roles reveal weaknesses in your game", "Power hitters learn what accumulators already know", "Accumulators learn what power hitters already know", "The crossover is where elite T20 batting lives", "Self-coach: what will you take from this into your natural game?"], "equipment": ["Cricket balls", "Bowling machine", "Scoreboard"]}',
  '{"description": "Role Reversal Showdown — score in opposite role for 3 overs. Then score in natural role for 3 overs. Reverse role score / Natural score ratio determines winner. Closest to 1.0 (equal in both) wins.", "scoring_rules": "3 overs reverse role, 3 overs natural role. Ratio: reverse/natural. Closest to 1.0 wins. Shows true versatility.", "consequence": "Furthest from 1.0 must play the opposite role in next week''s session drill."}',
  15, 2,
  '["Cricket balls", "Side-arm thrower", "Bowling machine (E tier)", "Scoreboard"]',
  ARRAY['batting', 'versatility', 'reverse roles', 'growth', 'power', 'accumulate', 'skill expansion'],
  3, 'Running 3s between sets', TRUE
);

-- ============================================================
-- WARM-UP (1)
-- ============================================================

-- 40. Daily Vitamins
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, max_balls_per_batter, between_sets_activity, is_global) VALUES (
  'b1000000-0003-4000-8000-000000000001',
  'Daily Vitamins',
  'warmup',
  'Warm-up Routine',
  'Standard session warm-up — Rapid Fire, knee sweeps, underarm drives/cuts/pulls, weighted balls. Every session starts here.',
  '{"description": "Gentle warm-up progression: (1) Rapid Fire with soft balls — light contact, 12 balls. (2) Knee sweep drives — on one knee, drive through the V, 6 each side. (3) Underarm drives, cuts, and pulls — 6 each. (4) Weighted ball swings — 10 reps.", "coaching_points": ["Purpose: activate the body and the eyes", "No power — this is warm-up, not training", "Watch the ball onto the bat every time", "Breathe: deep breaths between each segment", "Weighted balls: slow, controlled swings only"], "equipment": ["Soft balls", "Cricket balls", "Weighted training balls", "Cricket bat"]}',
  '{"description": "Increased tempo warm-up: (1) Rapid Fire at moderate pace — 12 balls. (2) Knee sweeps with spin — 6 each way. (3) Underarm drives/cuts/pulls with targets — 6 each. (4) Weighted ball swings with footwork — 10 reps. (5) 2-3 throws with side-arm to get eyes in.", "coaching_points": ["Building tempo gradually", "Add targets for placement during warm-up", "Side-arm throws to adjust eyes to pace", "Footwork patterns during weighted balls", "Transition from warm-up to drill-ready"], "equipment": ["Soft balls", "Cricket balls", "Weighted training balls", "Side-arm thrower", "Target cones"]}',
  '{"description": "Match-intensity warm-up: (1) Rapid Fire at pace — 12 balls. (2) Spin sweeps — all 3 types. (3) Side-arm drives/cuts/pulls at 110kph+. (4) Weighted balls with full kinetic chain. (5) 6 match-pace deliveries to calibrate eyes. Build to match intensity quickly.", "coaching_points": ["Elite warm-up mirrors match intensity", "Get to 80% match pace within the warm-up", "Kinetic chain should be fully activated", "Eyes calibrated to pace before drills start", "Mental preparation: visualise the session ahead"], "equipment": ["Cricket balls", "Weighted training balls", "Side-arm thrower", "Bowling machine (optional)"]}',
  '{"description": "Warm-up challenge: complete all stations fastest while maintaining quality. Coach rates technique at each station 1-5. Total time + quality rating combined. Fastest AND best quality wins.", "scoring_rules": "Complete all warm-up stations. Time recorded. Technique rated 1-5 at each station. Score: 100 - time(sec) + (quality rating x 5). Highest wins.", "consequence": "Slowest warm-up = first to bat in the hardest drill."}',
  10, 2,
  '["Soft balls", "Cricket balls", "Weighted training balls", "Cricket bat", "Side-arm thrower", "Target cones"]',
  ARRAY['warmup', 'daily vitamins', 'activation', 'eyes', 'routine'],
  NULL, NULL, TRUE
);

-- ============================================================
-- MENTAL PERFORMANCE (8)
-- ============================================================

-- M1. Performance Profiling
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, is_global) VALUES (
  'b1000000-0004-4000-8000-000000000001',
  'Performance Profiling',
  'mental',
  'Self-Assessment',
  'Individual performance profiling — players rate themselves across key cricket and life skills to identify development areas.',
  '{"description": "Introduction to performance profiling. Players complete a simple radar chart rating themselves 1-10 across: batting technique, bowling, fielding, fitness, mental toughness, team work. Group discussion about self-awareness.", "coaching_points": ["Honesty is essential — there are no wrong answers", "Rate where you are NOW, not where you want to be", "Identifying gaps is the first step to improving", "Everyone has areas to develop — that is normal", "This is private — share only what you are comfortable with"], "equipment": ["Profiling worksheets", "Pens", "Whiteboard"]}',
  '{"description": "Detailed performance profiling with sub-categories. Add: batting vs spin, batting vs pace, death bowling, fielding under pressure, fitness endurance vs power, pre-match routine quality. Compare self-rating to coach rating.", "coaching_points": ["Sub-categories reveal specific development areas", "Compare your rating vs coach rating — discuss gaps", "Overrating = lack of awareness. Underrating = lack of confidence", "Action planning: pick top 3 areas to develop", "Review monthly: are the ratings improving?"], "equipment": ["Detailed profiling worksheets", "Pens", "Whiteboard"]}',
  '{"description": "Elite performance profiling: add competition-specific categories. Include: pressure moments, decision-making speed, adaptability, self-coaching ability, teammate communication, leadership. Create an Individual Development Plan (IDP) from the profile.", "coaching_points": ["Elite profiles include mental and leadership skills", "IDP: Individual Development Plan based on profile gaps", "3-month plan: what will improve by end of program?", "Accountability: who checks progress?", "Profile is a living document — update regularly"], "equipment": ["Elite profiling worksheets", "IDP templates", "Pens"]}',
  '{"description": "Profile Challenge — players rate each other anonymously (peer assessment). Compare self-rating vs peer rating vs coach rating. Most accurate self-assessor (closest to average of peer + coach) wins.", "scoring_rules": "Self-rating vs average of peer + coach ratings. Smallest gap = most self-aware = wins.", "consequence": "Least self-aware player must lead the next group debrief."}',
  10, 1,
  '["Profiling worksheets", "Pens", "Whiteboard", "IDP templates"]',
  ARRAY['mental', 'performance profiling', 'self-assessment', 'awareness'],
  TRUE
);

-- M2. Goal Setting
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, is_global) VALUES (
  'b1000000-0004-4000-8000-000000000002',
  'Goal Setting',
  'mental',
  'Goal Setting',
  'SMART goal setting for cricket performance — setting process, performance, and outcome goals for the program.',
  '{"description": "Introduction to SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound). Each player sets 1 outcome goal, 1 performance goal, and 1 process goal for the 12-week program.", "coaching_points": ["Outcome goal: what do you want to achieve? (e.g., make rep squad)", "Performance goal: what performance level? (e.g., bat speed 100kph)", "Process goal: what will you DO? (e.g., 50 throws per week)", "SMART test each goal", "Write them down — goals in your head do not work"], "equipment": ["Goal setting worksheets", "Pens"]}',
  '{"description": "Goal ladder: break each goal into weekly milestones. If the 12-week goal is bat speed 100kph and current is 85kph, what is the weekly target? Create accountability pairs — partners check each other weekly.", "coaching_points": ["Break big goals into weekly steps", "Weekly milestones make goals manageable", "Accountability partner: check in every session", "Adjust goals if too easy or too hard — be honest", "Review and revise: goals are not set in stone"], "equipment": ["Goal setting worksheets", "Milestone tracker", "Pens"]}',
  '{"description": "Elite goal setting: add competition-specific goals, leadership goals, and team contribution goals. Create a visual goal board. Weekly self-review with traffic light system (green=on track, amber=slipping, red=off track).", "coaching_points": ["Elite athletes have multi-dimensional goals", "Leadership goals: how will you contribute to the team?", "Visual goal board: see your goals every day", "Traffic light review: honest weekly self-assessment", "Adjust process goals if performance goals are not being met"], "equipment": ["Goal worksheets", "Visual board materials", "Traffic light cards"]}',
  '{"description": "Goal Setting Tournament — present your goals to the group. Peers vote on: most inspiring, most specific, most achievable. Best goal presenter wins. This builds public accountability.", "scoring_rules": "Present goals to group. Peer vote: inspiring (1-5), specific (1-5), achievable (1-5). Total score. Highest wins.", "consequence": "Lowest scorer must revise goals and present again next session."}',
  10, 1,
  '["Goal setting worksheets", "Pens", "Visual board materials"]',
  ARRAY['mental', 'goal setting', 'SMART', 'planning', 'accountability'],
  TRUE
);

-- M3-M8: Remaining mental performance modules
INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, is_global) VALUES
(
  'b1000000-0004-4000-8000-000000000003',
  'Focus & Concentration',
  'mental',
  'Focus & Concentration',
  'Developing concentration skills and the ability to maintain focus under pressure and distraction.',
  '{"description": "Introduction to focus cues: visual (watch the seam), verbal (self-talk trigger words), and physical (tap bat on ground). Practice each cue during shadow batting. 10-minute focus exercise.", "coaching_points": ["Focus is a skill — it can be trained", "Visual cue: pick one thing to watch (seam, hand, release)", "Verbal cue: a word that triggers focus (e.g., ball)", "Physical cue: a consistent pre-ball routine", "Refocusing after distraction is the real skill"], "equipment": ["Whiteboard", "Pens"]}',
  '{"description": "Apply focus cues during live batting. Track focus rating per ball (1-10 self-rated). Introduce distractions and practice refocusing. Goal: maintain 7+ focus for 80% of deliveries.", "coaching_points": ["Self-rate focus after each ball", "Distractions will break focus — that is normal", "The skill is refocusing, not perfect focus", "Track your focus pattern: does it drop at certain points?", "80% of balls at 7+ focus is the target"], "equipment": ["Cricket balls", "Focus rating cards"]}',
  '{"description": "Match-pressure focus: simulate a match scenario with crowd noise, fielder chat, and scoreboard pressure. Track focus rating. Elite level: maintain 8+ focus for 90% of deliveries. Self-coach: what was your refocus strategy?", "coaching_points": ["Match pressure is the ultimate focus test", "8+ focus for 90% = elite concentration", "Refocus routine: breathe-reset-cue in 3 seconds", "Notice when focus drops and why", "Self-coach: describe your refocus strategy"], "equipment": ["Cricket balls", "Bluetooth speaker", "Scoreboard"]}',
  '{"description": "Focus Challenge — face 30 balls with progressive distractions. Self-rate focus per ball. Compare to coach rating. Most accurate self-assessment + highest average focus wins.", "scoring_rules": "Self-rate focus 1-10 per ball. Coach rates separately. Accuracy (self vs coach) + average focus score combined. Highest total wins.", "consequence": "Lowest focus average leads the next focus exercise."}',
  10, 1,
  '["Whiteboard", "Pens", "Focus rating cards", "Bluetooth speaker"]',
  ARRAY['mental', 'focus', 'concentration', 'refocusing', 'cues'],
  TRUE
),
(
  'b1000000-0004-4000-8000-000000000004',
  'Pressure Training',
  'mental',
  'Pressure Management',
  'Experiencing and managing performance pressure through simulated high-pressure scenarios with real consequences.',
  '{"description": "Introduction to pressure: discuss what pressure feels like (physical sensations, thoughts, behaviours). Simple pressure scenario: hit a target with the group watching. Debrief feelings.", "coaching_points": ["Pressure is normal — it means you care", "Physical signs: tight grip, shallow breathing, tense shoulders", "Thought patterns: what if I fail? Everyone is watching", "Pressure affects everyone differently", "Awareness is the first step to managing it"], "equipment": ["Cricket balls", "Target cones", "Whiteboard"]}',
  '{"description": "Escalating pressure scenarios: (1) Hit the target alone. (2) Hit with a partner watching. (3) Hit with the group watching. (4) Hit with consequence (losing team does burpees). Track how performance changes.", "coaching_points": ["Performance typically drops under pressure", "Notice YOUR personal pressure response", "Breathing: 4 counts in, 4 out — resets the system", "Pre-performance routine: same routine regardless of pressure", "Acceptance: pressure exists, work with it not against it"], "equipment": ["Cricket balls", "Target cones", "Scoreboard"]}',
  '{"description": "Match simulation pressure: last over, need 12 to win, team watching, consequences for failure. Track bat speed, decision-making, and technique under maximum pressure. Self-coach: compare rested vs pressured performance.", "coaching_points": ["Maximum pressure simulation: last over, team depends on you", "Bat speed under pressure tells you everything", "Decision-making quality under pressure is measurable", "Pre-ball routine is your pressure management tool", "Self-coach: what changed when the pressure was on?"], "equipment": ["Cricket balls", "Bowling machine", "Scoreboard", "Bat speed radar"]}',
  '{"description": "Pressure Cooker — escalating consequences. Round 1: low stakes. Round 2: medium. Round 3: group watching, losing team runs laps. Track performance degradation. Best pressure performer wins.", "scoring_rules": "3 rounds of escalating pressure. Score at each round. Least degradation (R3/R1 ratio) wins. Tiebreak: R3 absolute score.", "consequence": "Worst pressure performer addresses the group about what they learned."}',
  10, 1,
  '["Cricket balls", "Target cones", "Scoreboard", "Bowling machine (E tier)", "Bat speed radar"]',
  ARRAY['mental', 'pressure', 'anxiety', 'performance', 'resilience'],
  TRUE
),
(
  'b1000000-0004-4000-8000-000000000005',
  'Visualisation Intro',
  'mental',
  'Visualisation',
  'Introduction to mental imagery and visualisation techniques for performance enhancement.',
  '{"description": "Guided visualisation exercise: close eyes, imagine walking to the crease, taking guard, facing a ball, playing a perfect cover drive. Use all senses. 5-minute guided exercise. Debrief: what did you see/feel/hear?", "coaching_points": ["Use ALL senses: sight, sound, feel, smell", "Vivid imagery is more effective than vague", "First person (through your eyes) is most powerful", "Practice daily: 5 minutes before sleep", "Quality of imagery improves with practice"], "equipment": ["Quiet space", "Visualisation script"]}',
  '{"description": "Specific scenario visualisation: imagine a death over chase, see yourself executing specific shots, feel the pressure, visualise success. Follow with live batting to transfer. Compare quality.", "coaching_points": ["Visualise specific scenarios you will face", "Include pressure, emotions, and crowd noise", "See yourself succeeding — not just surviving", "Post-visualisation: does the live batting feel different?", "Build a personal highlight reel in your mind"], "equipment": ["Quiet space", "Visualisation script", "Cricket balls"]}',
  '{"description": "Advanced visualisation: pre-performance routine integration. Before each drill, visualise the first 3 balls. Execute, then compare. Elite athletes visualise before every performance. Self-coach: how accurate was your visualisation?", "coaching_points": ["Pre-performance visualisation: see it before you do it", "Accuracy improves with practice", "Visualise the kinetic chain firing correctly", "When visualisation matches execution — flow state", "Self-coach: rate visualisation accuracy 1-10"], "equipment": ["Quiet space"]}',
  '{"description": "Visualisation Accuracy Challenge — visualise 6 specific shots. Execute each one. Coach rates match between visualisation and execution. Best match wins.", "scoring_rules": "Describe your visualisation before each ball. Execute. Coach rates match 1-10. 6 balls. Total match score wins.", "consequence": "Lowest match score does the visualisation homework for the week."}',
  10, 1,
  '["Quiet space", "Visualisation script"]',
  ARRAY['mental', 'visualisation', 'imagery', 'mental rehearsal'],
  TRUE
),
(
  'b1000000-0004-4000-8000-000000000006',
  'Self-Talk Strategies',
  'mental',
  'Self-Talk',
  'Developing positive and instructional self-talk patterns to improve performance and manage negative thinking.',
  '{"description": "Introduction to self-talk: identify current self-talk patterns (positive, negative, instructional). Players write down what they say to themselves after a good shot, a bad shot, and under pressure. Group discussion.", "coaching_points": ["Everyone talks to themselves — it is normal", "Negative self-talk: watch the ball becomes I always miss", "Positive self-talk: I can do this, I am prepared", "Instructional self-talk: watch the ball, move your feet", "Awareness of current patterns is step one"], "equipment": ["Worksheets", "Pens", "Whiteboard"]}',
  '{"description": "Self-talk replacement: identify top 3 negative self-talk phrases and create positive/instructional replacements. Practice during live batting. Partner monitors and signals when negative self-talk is detected.", "coaching_points": ["Replace: I always miss → watch the ball, soft hands", "Replace: I cannot hit spin → move your feet, get to the pitch", "Partner accountability: catch the negative talk", "Instructional talk is most effective during performance", "Positive talk is best between balls (not during)"], "equipment": ["Worksheets", "Cricket balls", "Side-arm thrower"]}',
  '{"description": "Self-talk under pressure: maintain positive/instructional self-talk during match simulation pressure. Coach listens for negative self-talk. Track: does self-talk quality correlate with performance quality?", "coaching_points": ["Under pressure, self-talk often reverts to negative", "Pre-ball routine includes your self-talk trigger", "If you hear negative self-talk: stop, breathe, replace", "Track the correlation: good self-talk = good performance?", "Self-coach: what did you say to yourself in the tough moments?"], "equipment": ["Cricket balls", "Bowling machine", "Scoreboard"]}',
  '{"description": "Self-Talk Battle — pairs bat together, each monitoring the other for negative self-talk. Catch a negative self-talk = +2 to your score. Get caught = -2. Batting runs scored normally. Most positive talker wins.", "scoring_rules": "Batting runs scored normally. Catch partner in negative self-talk = +2 to you. Get caught = -2. Combined score (batting + self-talk monitoring) wins.", "consequence": "Most negative self-talker writes 3 positive affirmations on their bat."}',
  10, 1,
  '["Worksheets", "Pens", "Whiteboard", "Cricket balls"]',
  ARRAY['mental', 'self-talk', 'positive thinking', 'instructional'],
  TRUE
),
(
  'b1000000-0004-4000-8000-000000000007',
  'Pre-Performance Routines',
  'mental',
  'Pre-Performance Routines',
  'Developing consistent pre-ball and pre-innings routines that anchor focus and manage arousal levels.',
  '{"description": "Introduction to pre-performance routines: the consistent sequence of actions before each delivery. Analyse elite batters'' routines (Virat Kohli, AB de Villiers). Each player designs their own 5-step pre-ball routine.", "coaching_points": ["A routine is your anchor — it grounds you", "5 steps: e.g., (1) tap bat, (2) look at field, (3) deep breath, (4) trigger movement, (5) eyes on bowler", "Consistency: same routine every ball", "Routine should take 5-10 seconds", "Analyse elite players — what do they do?"], "equipment": ["Video examples", "Worksheets", "Pens"]}',
  '{"description": "Practice the routine during live batting. Coach rates routine consistency (1-5 per ball). Must complete routine before every delivery regardless of situation. Track: does routine consistency correlate with shot quality?", "coaching_points": ["Complete the routine EVERY ball — no shortcuts", "Under pressure, the routine may speed up — notice this", "Routine is the same for a defensive push and a slog sweep", "Consistency of routine = consistency of performance", "If you forget the routine, step away and restart"], "equipment": ["Cricket balls", "Side-arm thrower", "Routine checklist"]}',
  '{"description": "Routine under match pressure: complete routine during death-over simulation. Coach monitors: did the routine shorten or change? Routine breakdown under pressure = focus breakdown. Self-coach: rate your routine consistency.", "coaching_points": ["Routine breakdown under pressure = early warning sign", "If routine changes, performance will follow", "The routine IS your pressure management", "Elite batters: routine is identical in net and in finals", "Self-coach: was your routine the same under pressure?"], "equipment": ["Cricket balls", "Bowling machine", "Scoreboard"]}',
  '{"description": "Routine Consistency Challenge — 18 balls, coach rates routine consistency 1-5 on each. Any ball where routine scored <3 = runs do not count. Most runs WITH consistent routine wins.", "scoring_rules": "18 balls. Routine rated 1-5 per ball. Runs only count on balls with routine 3+. Most valid runs wins.", "consequence": "Least consistent performer videotapes themselves and reviews with coach."}',
  10, 1,
  '["Video examples", "Worksheets", "Pens", "Cricket balls", "Bowling machine"]',
  ARRAY['mental', 'routine', 'pre-performance', 'consistency', 'anchor'],
  TRUE
),
(
  'b1000000-0004-4000-8000-000000000008',
  'Game Scenario Debrief',
  'mental',
  'Reflection / Analysis',
  'Structured post-session or post-game debrief to build self-awareness, reflective practice, and continuous improvement.',
  '{"description": "Guided debrief: What went well? What did not go well? What will I do differently? Each player shares 1 thing from each category. Coach facilitates. Group learning from shared experiences.", "coaching_points": ["Honest reflection is a skill — practice it", "Start with what went WELL — positive first", "What did not go well: be specific, not vague", "What will I do differently: must be actionable", "Listen to others — their insights help you too"], "equipment": ["Whiteboard", "Pens", "Debrief template"]}',
  '{"description": "Detailed debrief with video review (if available). Players identify specific moments: best shot, worst shot, best decision, worst decision. Create an action item for next session.", "coaching_points": ["Video does not lie — review objectively", "Best shot: WHY was it good? Replicate that", "Worst shot: WHAT went wrong? Fix that", "Best decision: how did you make that decision?", "Action item: one specific thing to work on next session"], "equipment": ["Whiteboard", "Pens", "Video playback (optional)", "Debrief template"]}',
  '{"description": "Elite debrief: self-coaching analysis. Review performance against IDP goals. Rate the session 1-10 across: technique, decision-making, mental resilience, fitness, team contribution. Compare to previous session ratings.", "coaching_points": ["Self-coaching: you must be your own best coach", "Rate against IDP goals — are you progressing?", "Trend analysis: are ratings improving over weeks?", "Peer feedback: ask a teammate to rate you too", "Elite athletes debrief EVERY session — non-negotiable"], "equipment": ["IDP documents", "Rating sheets", "Pens"]}',
  '{"description": "Debrief Quiz — coach asks specific questions about the session (what drill was hardest? what was the coaching point on drill 3?). Players who were most engaged/attentive answer correctly. Best score wins.", "scoring_rules": "10 questions about the session. Each correct answer = 1 point. Ties broken by detail quality. Highest score wins.", "consequence": "Lowest scorer must write a 3-sentence summary of the session and share it with the group."}',
  10, 1,
  '["Whiteboard", "Pens", "Debrief template", "Video playback (optional)", "IDP documents"]',
  ARRAY['mental', 'debrief', 'reflection', 'analysis', 'self-coaching'],
  TRUE
);

-- ============================================================
-- S&C / ATHLETIC DEVELOPMENT (6)
-- ============================================================

INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, is_global) VALUES
(
  'b1000000-0005-4000-8000-000000000001',
  'Strength & Mobility',
  'fitness',
  'Strength & Mobility',
  'Foundation strength and mobility session — delivered by specialist S&C coach (Jason Cox / Sol Athletic Development).',
  '{"description": "Bodyweight strength and mobility circuit: squats, lunges, push-ups, planks, hip flexor stretches, thoracic rotation. 3 rounds of 10 reps each. Focus on movement quality over load.", "coaching_points": ["Quality of movement over quantity", "Full range of motion on every rep", "Control the eccentric (lowering) phase", "Breathe: exhale on effort", "Mobility work is not optional — it prevents injury"], "equipment": ["Yoga mats", "Resistance bands (light)"]}',
  '{"description": "Loaded strength and extended mobility: goblet squats, split squats, dumbbell rows, pallof press, banded hip stretches, foam rolling. Progressive overload from previous session.", "coaching_points": ["Progressive overload: slightly more than last time", "Load should challenge but not compromise form", "Mobility between strength sets — active recovery", "Core engagement on every exercise", "Track loads to measure improvement"], "equipment": ["Dumbbells", "Resistance bands", "Yoga mats", "Foam rollers"]}',
  '{"description": "Cricket-specific strength: rotational power, single-leg stability, posterior chain strength, thoracic mobility for batting. Load matches cricket demands. Assessment-driven programming.", "coaching_points": ["Cricket-specific: rotational, unilateral, posterior chain", "Load matches the forces in batting/bowling", "Single-leg stability prevents lateral ankle injuries", "Thoracic mobility enables full batting rotation", "Programme adjusted based on assessment data"], "equipment": ["Dumbbells", "Kettlebells", "Resistance bands", "Stability equipment"]}',
  '{"description": "Strength Challenge — max reps in 60 seconds on 3 exercises (push-ups, squats, plank hold). Total score across all 3. Form must be maintained — coach discounts bad reps.", "scoring_rules": "3 exercises, 60 seconds each. Clean reps only (coach judges). Total reps across all 3 wins.", "consequence": "Lowest total does an extra mobility circuit."}',
  30, 1,
  '["Yoga mats", "Dumbbells", "Kettlebells", "Resistance bands", "Foam rollers", "Stability equipment"]',
  ARRAY['fitness', 'strength', 'mobility', 'S&C', 'injury prevention'],
  TRUE
),
(
  'b1000000-0005-4000-8000-000000000002',
  'Athletic Development',
  'fitness',
  'Athletic Development',
  'General athletic development — multi-directional movement, coordination, and athletic base building.',
  '{"description": "Movement circuit: bear crawls, crab walks, lateral shuffles, skipping, bounding. 2 rounds. Focus on developing general athleticism and movement vocabulary.", "coaching_points": ["Athleticism is the foundation of all cricket skills", "Multi-directional movement builds injury resilience", "Coordination drills wake up the nervous system", "Quality of movement: smooth and controlled", "Enjoy the variety — this is not boring gym work"], "equipment": ["Cones", "Agility ladder"]}',
  '{"description": "Progressive athletic development: add complexity (change of direction, reaction cues), increase speed, combine movements. Include cricket-specific patterns: fielding dives, run-up patterns, throw mechanics.", "coaching_points": ["Cricket-specific movement patterns", "Change of direction at speed = injury risk if untrained", "Reaction cues develop game-speed processing", "Combine movements: run, slide, throw in sequence", "Asymmetry check: is one side weaker?"], "equipment": ["Cones", "Agility ladder", "Reaction balls", "Cricket balls"]}',
  '{"description": "Elite athletic development: sport-specific power, speed, and agility programming. Tailored to individual needs based on movement screen results. Periodised to match training phase.", "coaching_points": ["Individualised based on movement screen", "Periodised: base building early, power later", "Sport-specific: movements that transfer to cricket", "Recovery is part of the program — respect it", "Track athletic markers: vertical jump, sprint time, agility test"], "equipment": ["Cones", "Agility ladder", "Plyo boxes", "Hurdles", "Timing gates"]}',
  '{"description": "Athletic Combine — test battery: 20m sprint, agility T-test, vertical jump, broad jump. Total score across all tests. Compare to baseline from Week 1.", "scoring_rules": "4 tests, each scored relative to group average. Total standardised score wins. Compare to Week 1 baseline.", "consequence": "Most improved gets recognition. Least improved gets individualised homework."}',
  30, 1,
  '["Cones", "Agility ladder", "Plyo boxes", "Hurdles", "Reaction balls", "Timing gates"]',
  ARRAY['fitness', 'athletic development', 'movement', 'coordination', 'agility'],
  TRUE
),
(
  'b1000000-0005-4000-8000-000000000003',
  'Speed & Agility',
  'fitness',
  'Speed & Agility',
  'Speed, agility, and quickness training — developing the explosive movement required for cricket.',
  '{"description": "Speed foundations: sprint mechanics (arm drive, knee lift, foot strike), 10-20m acceleration sprints, basic agility ladder patterns. Focus on technique not speed.", "coaching_points": ["Sprint technique: high knees, powerful arms, toe-first strike", "Acceleration: lean forward, drive from the ground", "Agility ladder: quick feet, stay light", "Technique before speed — always", "Rest between reps: speed work needs full recovery"], "equipment": ["Cones", "Agility ladder", "Stopwatch"]}',
  '{"description": "Advanced speed and agility: reaction-based sprints (coach points direction), change-of-direction drills, lateral speed work. Increase intensity and reduce rest times.", "coaching_points": ["Reaction-based sprints develop game-speed responses", "Change of direction: decelerate, plant, accelerate", "Lateral speed: critical for fielding", "Reduce rest to build repeat sprint ability", "Track times to measure improvement"], "equipment": ["Cones", "Agility ladder", "Stopwatch", "Reaction bands"]}',
  '{"description": "Cricket-specific speed: between-wicket sprints with bat, fielding ground-to-throw speed, run-up speed for bowlers. Timed and tracked against benchmarks.", "coaching_points": ["Between-wicket speed with bat in hand", "Fielding: ground ball to throw in minimum time", "Speed endurance: repeat sprints with short rest", "Cricket-specific benchmarks vs general speed", "Periodisation: peak speed for competition phase"], "equipment": ["Cones", "Timing gates", "Cricket bats", "Cricket balls"]}',
  '{"description": "Speed Showdown — 20m sprint, 5-10-5 agility shuttle, reaction sprint. Total time across all 3. Fastest combined time wins.", "scoring_rules": "3 timed tests. Combined time wins. Reaction sprint: time from signal to 10m mark.", "consequence": "Slowest overall time does 5 extra sprints."}',
  20, 1,
  '["Cones", "Agility ladder", "Stopwatch", "Timing gates", "Cricket bats"]',
  ARRAY['fitness', 'speed', 'agility', 'quickness', 'sprinting'],
  TRUE
),
(
  'b1000000-0005-4000-8000-000000000004',
  'Power Training',
  'fitness',
  'Power Training',
  'Explosive power development — medicine balls, plyometrics, and loaded movements for cricket-specific power.',
  '{"description": "Intro to power: medicine ball throws (chest pass, overhead, rotational), box jumps (low), broad jumps. Focus on INTENT — move as fast as possible. 3 sets of 5 reps each.", "coaching_points": ["Power = force x velocity. Move FAST.", "Medicine ball: release at maximum speed", "Box jumps: land softly, step down (do not jump down)", "Broad jumps: triple extension (ankle, knee, hip)", "Intent matters more than load at this stage"], "equipment": ["Medicine balls", "Plyo boxes (low)", "Mats"]}',
  '{"description": "Progressive power: heavier medicine balls, higher boxes, loaded jumps (light vest). Add cricket-specific power: rotational med ball slams (batting), overhead slams (bowling action).", "coaching_points": ["Progressive overload: slightly more challenge", "Rotational power: core drives the throw", "Cricket-specific: batting rotation = med ball rotation", "Bowling: overhead slam mimics the delivery action", "Fatigue kills power — rest fully between sets"], "equipment": ["Medicine balls (varied weight)", "Plyo boxes", "Weight vest (light)", "Slam balls"]}',
  '{"description": "Elite power: Olympic lift variations (clean pulls, push press), loaded rotational power, reactive plyometrics. Periodised to peak for competition. Tracked: vertical jump, med ball throw distance, bat speed.", "coaching_points": ["Olympic lifts develop total body power", "Loaded rotation: cricket-specific power transfer", "Reactive plyometrics: drop jump, hurdle hops", "Peak power for competition phase — not off-season", "Track bat speed: does power training transfer?"], "equipment": ["Barbell", "Medicine balls", "Plyo boxes", "Hurdles", "Bat speed radar"]}',
  '{"description": "Power Olympics — medicine ball throw for distance (rotational + overhead), vertical jump max, broad jump max. Total distance/height across all events. Most powerful athlete wins.", "scoring_rules": "3 events: med ball throw (distance), vertical jump (height), broad jump (distance). Combined measurements. Highest total wins.", "consequence": "Weakest event for each player becomes homework focus."}',
  20, 1,
  '["Medicine balls", "Plyo boxes", "Slam balls", "Mats", "Bat speed radar"]',
  ARRAY['fitness', 'power', 'explosive', 'plyometrics', 'medicine ball'],
  TRUE
),
(
  'b1000000-0005-4000-8000-000000000005',
  'Movement Screen',
  'fitness',
  'Assessment',
  'Functional movement screening to identify movement limitations, asymmetries, and injury risk factors.',
  '{"description": "Basic movement screen: overhead squat, single-leg squat, push-up, hip hinge, shoulder mobility. Coach observes and rates each movement 1-3. Identifies major limitations.", "coaching_points": ["This is assessment, not training", "Move naturally — do not try to look perfect", "We are looking for limitations and asymmetries", "Limitations = areas to improve, not weaknesses", "Results guide your individual program"], "equipment": ["Movement screen score sheets", "Dowel rod"]}',
  '{"description": "Detailed screen: add rotational assessment, single-leg balance, thoracic rotation, hip internal/external rotation. Compare left vs right. Create individualised corrective exercise plan.", "coaching_points": ["Detailed screen reveals cricket-specific limitations", "Left vs right comparison shows asymmetries", "Asymmetries over 15% = injury risk", "Corrective exercises assigned based on results", "Rescreen in 4 weeks to track improvement"], "equipment": ["Movement screen forms", "Goniometer", "Dowel rod", "Tape measure"]}',
  '{"description": "Comprehensive movement screen with technology: force plates (if available), video analysis of movement patterns. Generate a detailed movement report. Link findings to cricket performance.", "coaching_points": ["Technology adds precision to the assessment", "Force plate data reveals power asymmetries", "Video analysis: slow-motion movement review", "Link findings: hip limitation = batting power issue", "Report drives the S&C programming for this athlete"], "equipment": ["Movement screen forms", "Video camera", "Force plates (if available)"]}',
  '{"description": "Movement Screen Challenge — who can improve the most from baseline? Rescreen every 4 weeks. Biggest improvement in total screen score wins recognition.", "scoring_rules": "Baseline screen score vs 4-week rescreen score. Biggest total improvement wins.", "consequence": "No consequence — this is about improvement, not competition."}',
  30, 1,
  '["Movement screen forms", "Dowel rod", "Goniometer", "Video camera"]',
  ARRAY['fitness', 'assessment', 'movement screen', 'injury prevention', 'FMS'],
  TRUE
),
(
  'b1000000-0005-4000-8000-000000000006',
  'Strength Assessment',
  'fitness',
  'Assessment',
  'Baseline strength testing to establish training loads and track progress throughout the program.',
  '{"description": "Basic strength assessment: push-up max, squat hold time, plank hold time, grip strength (if dynamometer available). Establish baselines for training load prescription.", "coaching_points": ["This sets your starting point — be honest", "Max reps with good form only — no cheating", "Hold tests: stop when form breaks down", "Results are personal — do not compare to others yet", "These numbers will improve — that is the point"], "equipment": ["Timer", "Assessment forms", "Grip dynamometer (optional)"]}',
  '{"description": "Intermediate assessment: estimated 1RM (5-rep max calculation) for squat, bench press, deadlift. Add: vertical jump, broad jump, medicine ball throw. Comprehensive strength and power profile.", "coaching_points": ["5-rep max used to estimate 1RM safely", "Proper form on every rep — coach supervises", "Power tests complement strength tests", "Profile shows relative strengths and weaknesses", "Training loads set from these numbers"], "equipment": ["Barbell", "Weights", "Medicine balls", "Assessment forms", "Calculator"]}',
  '{"description": "Elite assessment: full strength and power profile. Include rate of force development tests, reactive strength index, isometric strength tests. Data-driven programming. Compare to cricket-specific benchmarks.", "coaching_points": ["Data-driven approach to strength programming", "Rate of force development: how fast you produce force", "Reactive strength: ability to use stretch-shortening cycle", "Cricket benchmarks: what levels do elite cricketers hit?", "Retesting schedule: every 4-6 weeks"], "equipment": ["Barbell", "Weights", "Force plates (if available)", "Assessment forms"]}',
  '{"description": "Strength Combine — 3 key tests: squat (relative to bodyweight), push-up max, plank hold. Combined score. Test every 4 weeks. Track improvement. Most improved wins.", "scoring_rules": "Squat relative to BW + push-up max + plank hold (seconds). Combined score. Retest in 4 weeks. Most improved wins.", "consequence": "No consequence — celebrate improvement."}',
  30, 1,
  '["Barbell", "Weights", "Timer", "Assessment forms", "Medicine balls"]',
  ARRAY['fitness', 'assessment', 'strength', 'baseline', 'testing'],
  TRUE
);

-- ============================================================
-- BOWLING ASSESSMENT (2)
-- ============================================================

INSERT INTO sp_activities (id, name, category, sub_category, description, regression, progression, elite, gamify, default_duration_mins, default_lanes, equipment, tags, is_global) VALUES
(
  'b1000000-0006-4000-8000-000000000001',
  'Bowling Baseline Assessment',
  'pace_bowling',
  'Bowling Assessment',
  'Comprehensive bowling baseline assessment delivered by specialist (Bowl Strong) — action analysis, speed, accuracy, and workload capacity.',
  '{"description": "Basic bowling assessment: action video from front and side. 6 balls at comfortable pace. Coach assesses: alignment, front foot contact, arm speed, release point, follow-through. Establish baseline action.", "coaching_points": ["Bowl at comfortable pace — not maximum effort", "Natural action — do not try to change anything today", "6 balls is enough for baseline — quality over quantity", "Video analysis will be reviewed together", "This identifies areas to work on, not problems"], "equipment": ["Cricket balls", "Video camera/phone", "Stumps", "Assessment forms"]}',
  '{"description": "Detailed assessment: 3 overs at match intensity. Speed gun readings. Accuracy targets (good length zone). Seam position at release. Wrist position analysis. Create bowling profile.", "coaching_points": ["Match intensity: bowl as you would in a game", "Speed gun: establishes your pace baseline", "Accuracy: how many land in the target zone?", "Seam position: upright, wobble, or cross-seam", "Bowling profile: speed + accuracy + seam = your identity"], "equipment": ["Cricket balls", "Speed gun", "Video camera", "Target zone markers", "Assessment forms"]}',
  '{"description": "Comprehensive assessment: match simulation bowling. 4 overs with varied plans (powerplay, middle overs, death). Workload tracking (balls, intensity). Biomechanical analysis if available. Injury risk assessment.", "coaching_points": ["Match simulation: bowl as you would in different phases", "Powerplay: aggressive, seek wickets", "Middle overs: control, restrict runs", "Death: yorkers, slower balls, variations", "Workload baseline: how many balls at max intensity?"], "equipment": ["Cricket balls", "Speed gun", "Video camera", "Target zone markers", "Biomechanics equipment (if available)"]}',
  '{"description": "Bowling Combine — 12 balls: accuracy (target zone hits), speed (average and max), variation (demonstrate 3 deliveries). Combined score across all categories.", "scoring_rules": "Accuracy: target zone hits out of 12. Speed: max speed reading. Variation: quality rating of 3 variations (1-10 each). Combined score.", "consequence": "No consequence — baseline is for development."}',
  30, 2,
  '["Cricket balls", "Speed gun", "Video camera", "Stumps", "Target zone markers", "Assessment forms"]',
  ARRAY['bowling', 'pace', 'assessment', 'baseline', 'Bowl Strong'],
  TRUE
),
(
  'b1000000-0006-4000-8000-000000000002',
  'Pace Assessment',
  'pace_bowling',
  'Pace Assessment',
  'Pace bowling specific assessment — speed benchmarking, run-up analysis, and pace development potential.',
  '{"description": "Pace introduction: 6 balls with speed gun. Establish comfortable pace, near-maximum pace, and maximum effort pace. Analyse the difference between each level. Assess run-up efficiency.", "coaching_points": ["3 levels: comfortable, near-max, maximum", "Speed difference between levels shows potential", "Large gap = untapped pace available", "Run-up: is it efficient? Wasted steps = lost energy", "Maximum effort is not always maximum speed — assess this"], "equipment": ["Cricket balls", "Speed gun", "Video camera"]}',
  '{"description": "Pace development assessment: 12 balls at match intensity. Track speed consistency (variance between deliveries). Assess: does speed drop over 12 balls? If so, fitness or technique issue? Run-up videoed for analysis.", "coaching_points": ["Speed consistency matters more than single max reading", "Speed drop over 12 balls = fitness issue", "Speed variance ball to ball = technique inconsistency", "Run-up video: is rhythm consistent?", "Match: 4 overs = 24 balls. Can you maintain pace?"], "equipment": ["Cricket balls", "Speed gun", "Video camera", "Assessment forms"]}',
  '{"description": "Elite pace assessment: full spell (4 overs), speed tracked every ball. Graph the speed curve. Optimal pace: 90-95% of maximum for match bowling. Death bowling: can you find extra pace? Biomechanical efficiency assessment.", "coaching_points": ["Optimal match pace: 90-95% of max", "Speed curve: should be relatively flat across spell", "Death overs: can you find extra 5-10% when needed?", "Biomechanical efficiency: how much effort per kph?", "Elite: consistent pace with ability to spike when needed"], "equipment": ["Cricket balls", "Speed gun", "Video camera", "Biomechanics equipment (if available)", "Assessment forms"]}',
  '{"description": "Pace Challenge — 6 balls for max speed. Then 6 balls for consistency (smallest variance). Then 6 balls for accuracy at pace. Best combined score across speed, consistency, and accuracy wins.", "scoring_rules": "Max speed (kph) + consistency bonus (lowest variance x2) + accuracy (targets hit x3). Combined score wins.", "consequence": "Lowest scorer gets bowling homework: 50 balls at target this week."}',
  30, 2,
  '["Cricket balls", "Speed gun", "Video camera", "Stumps", "Target zone markers"]',
  ARRAY['bowling', 'pace', 'assessment', 'speed', 'Bowl Strong'],
  TRUE
);

-- ============================================================
-- VERIFICATION: Count activities
-- ============================================================
-- Expected: 56 total activities
-- Skill Acquisition: 23 (b1000000-0001-4000-8000-000000000001 to 23)
-- Skill Expansion:  16 (b1000000-0002-4000-8000-000000000001 to 16)
-- Warm-up:           1 (b1000000-0003-4000-8000-000000000001)
-- Mental:            8 (b1000000-0004-4000-8000-000000000001 to 08)
-- S&C:               6 (b1000000-0005-4000-8000-000000000001 to 06)
-- Bowling:           2 (b1000000-0006-4000-8000-000000000001 to 02)
