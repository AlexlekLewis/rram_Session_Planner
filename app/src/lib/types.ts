// ============================================================================
// RRA Session Planner — Core Type Definitions
// ============================================================================

export type UserRole = "head_coach" | "assistant_coach" | "guest_coach" | "player";

export type SessionStatus = "draft" | "published" | "completed";

export type BlockCategory =
  | "batting"
  | "batting_power"
  | "pace_bowling"
  | "spin_bowling"
  | "wicketkeeping"
  | "fielding"
  | "fitness"
  | "mental"
  | "tactical"
  | "warmup"
  | "cooldown"
  | "transition"
  | "other";

export type Tier = "R" | "P" | "E" | "G";

export type LaneType = "bowling_machine" | "long_lane" | "other";

// ============================================================================
// Database Models
// ============================================================================

export interface Program {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  program_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  goals: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  short_name?: string;
  address?: string;
  lanes: LaneConfig[];
  created_at: string;
}

export interface LaneConfig {
  id: number;
  label: string;
  type: LaneType;
  short: string;
}

export interface Squad {
  id: string;
  program_id: string;
  name: string;
  colour: string;
  description?: string;
  session_days: SquadSessionDay[];
  max_players: number;
  created_at: string;
}

export interface SquadSessionDay {
  day: string;
  time: string;
}

export interface Coach {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  role: UserRole;
  speciality?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  program_id: string;
  phase_id?: string;
  venue_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  squad_ids: string[];
  specialist_coaches: SpecialistCoach[];
  theme?: string;
  status: SessionStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  phase?: Phase;
  venue?: Venue;
  squads?: Squad[];
  blocks?: SessionBlock[];
}

export interface SpecialistCoach {
  name: string;
  role: string;
  notes?: string;
}

export interface SessionBlock {
  id: string;
  session_id: string;
  activity_id?: string;
  name: string;
  lane_start: number;
  lane_end: number;
  time_start: string;
  time_end: string;
  colour: string;
  category: BlockCategory;
  tier: Tier;
  other_location?: string;
  coaching_notes?: string;
  coaching_points: string[];
  player_groups: string[];
  equipment: string[];
  coach_assigned?: string;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  name: string;
  category: BlockCategory;
  sub_category?: string;
  description?: string;
  regression: TierDetail;
  progression: TierDetail;
  elite: TierDetail;
  gamify: GamifyDetail;
  default_duration_mins: number;
  default_lanes: number;
  equipment: string[];
  tags: string[];
  youtube_reference?: string;
  constraints_cla?: string;
  coaching_framework: CoachingFramework;
  max_balls_per_batter?: number;
  between_sets_activity?: string;
  created_by?: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface TierDetail {
  description?: string;
  coaching_points?: string[];
  equipment?: string[];
}

export interface GamifyDetail extends TierDetail {
  scoring_rules?: string;
  consequence?: string;
}

export interface CoachingFramework {
  gfr_focus?: string;
  kinetic_chain_focus?: string;
  intent_clarity?: string;
}

// ============================================================================
// UI / Interaction Types
// ============================================================================

export interface BlockPosition {
  laneStart: number;
  laneEnd: number;
  timeStart: string;
  timeEnd: string;
}

export interface GridSelection {
  isSelecting: boolean;
  startLane: number;
  startTime: string;
  endLane: number;
  endTime: string;
}

export type SaveStatus = "saved" | "saving" | "error" | "offline";

export interface UndoAction {
  type: "create" | "update" | "delete" | "move" | "resize";
  blockId: string;
  previousState: Partial<SessionBlock> | null;
  newState: Partial<SessionBlock> | null;
}
