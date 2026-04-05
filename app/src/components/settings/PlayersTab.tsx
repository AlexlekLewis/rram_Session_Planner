"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Player, Squad, Program, PlayerRole, BowlingStyle, BattingHand } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Save, Search, Upload, AlertTriangle, X, ChevronDown, Users, Eye } from "lucide-react";
import { PlayerProfileModal } from "./PlayerProfileModal";

// ============================================================================
// Constants
// ============================================================================

const ROLE_LABELS: Record<PlayerRole, string> = {
  batsman: "Batsman",
  bowler: "Bowler",
  all_rounder: "All-Rounder",
  wicketkeeper: "Wicketkeeper",
  wicketkeeper_batsman: "WK-Batsman",
};

const ROLE_BADGE_COLOURS: Record<PlayerRole, string> = {
  batsman: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  bowler: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  all_rounder: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  wicketkeeper: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  wicketkeeper_batsman: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

const BOWLING_STYLE_LABELS: Record<BowlingStyle, string> = {
  right_arm_fast: "RAF",
  right_arm_medium: "RAM",
  right_arm_offspin: "RAOS",
  right_arm_legspin: "RALS",
  left_arm_fast: "LAF",
  left_arm_medium: "LAM",
  left_arm_orthodox: "LAO",
  left_arm_wrist: "LAW",
};

const BOWLING_STYLE_FULL_LABELS: Record<BowlingStyle, string> = {
  right_arm_fast: "Right Arm Fast",
  right_arm_medium: "Right Arm Medium",
  right_arm_offspin: "Right Arm Off Spin",
  right_arm_legspin: "Right Arm Leg Spin",
  left_arm_fast: "Left Arm Fast",
  left_arm_medium: "Left Arm Medium",
  left_arm_orthodox: "Left Arm Orthodox",
  left_arm_wrist: "Left Arm Wrist Spin",
};

const ALL_ROLES: PlayerRole[] = ["batsman", "bowler", "all_rounder", "wicketkeeper", "wicketkeeper_batsman"];
const ALL_BOWLING_STYLES: BowlingStyle[] = [
  "right_arm_fast", "right_arm_medium", "right_arm_offspin", "right_arm_legspin",
  "left_arm_fast", "left_arm_medium", "left_arm_orthodox", "left_arm_wrist",
];

const INPUT_CLASS =
  "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none";

// ============================================================================
// Types
// ============================================================================

interface PlayersTabProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  squads: Squad[];
  program: Program | null;
  supabase: ReturnType<typeof createClient>;
}

interface PlayerFormData {
  first_name: string;
  last_name: string;
  role: PlayerRole | "";
  cricket_type: "male" | "female" | "";
  batting_hand: BattingHand | "";
  bowling_style: BowlingStyle | "";
  squad_ids: string[];
  club: string;
  dob: string;
  notes: string;
  is_active: boolean;
}

interface ImportRow {
  first_name: string;
  last_name: string;
  club: string;
  cricket_type: "male" | "female" | "";
}

const EMPTY_FORM: PlayerFormData = {
  first_name: "",
  last_name: "",
  role: "",
  cricket_type: "",
  batting_hand: "",
  bowling_style: "",
  squad_ids: [],
  club: "",
  dob: "",
  notes: "",
  is_active: true,
};

// ============================================================================
// Helpers
// ============================================================================

function isProfileIncomplete(player: Player): boolean {
  return !player.role || !player.batting_hand;
}

function getSquadById(squads: Squad[], id: string): Squad | undefined {
  return squads.find((s) => s.id === id);
}

// ============================================================================
// PlayersTab Component
// ============================================================================

export function PlayersTab({ players, setPlayers, squads, program, supabase }: PlayersTabProps) {
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSquad, setFilterSquad] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterCricketType, setFilterCricketType] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlayer, setNewPlayer] = useState(false);
  const [form, setForm] = useState<PlayerFormData>({ ...EMPTY_FORM });
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const newPlayerFormRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to new player form when it appears
  useEffect(() => {
    if (newPlayer && newPlayerFormRef.current) {
      newPlayerFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [newPlayer]);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // Active filter
      if (!showInactive && p.is_active === false) return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        if (!fullName.includes(q) && !(p.club || "").toLowerCase().includes(q)) return false;
      }

      // Squad filter
      if (filterSquad !== "all") {
        if (!p.squad_ids || !p.squad_ids.includes(filterSquad)) return false;
      }

      // Role filter
      if (filterRole !== "all") {
        if (p.role !== filterRole) return false;
      }

      // Cricket type filter
      if (filterCricketType !== "all") {
        if (p.cricket_type !== filterCricketType) return false;
      }

      return true;
    }).sort((a, b) => {
      const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
      const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [players, searchQuery, filterSquad, filterRole, filterCricketType, showInactive]);

  // Stats
  const stats = useMemo(() => {
    const active = players.filter((p) => p.is_active !== false);
    const roleCounts: Partial<Record<PlayerRole, number>> = {};
    for (const p of active) {
      if (p.role) {
        roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      }
    }
    const incomplete = active.filter(isProfileIncomplete).length;
    return { total: players.length, active: active.length, roleCounts, incomplete };
  }, [players]);

  // ---- CRUD Operations ----

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setNewPlayer(false);
    setForm({
      first_name: player.first_name,
      last_name: player.last_name,
      role: player.role || "",
      cricket_type: player.cricket_type || "",
      batting_hand: player.batting_hand || "",
      bowling_style: player.bowling_style || "",
      squad_ids: player.squad_ids || [],
      club: player.club || "",
      dob: player.dob || "",
      notes: player.notes || "",
      is_active: player.is_active !== false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewPlayer(false);
    setForm({ ...EMPTY_FORM });
  };

  const savePlayer = async (id?: string) => {
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      squad_ids: form.squad_ids,
      club: form.club.trim() || null,
      dob: form.dob || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
      role: form.role || null,
      cricket_type: form.cricket_type || null,
      batting_hand: form.batting_hand || null,
      bowling_style: form.bowling_style || null,
    };

    if (id) {
      // Optimistic update
      const prev = players.find((p) => p.id === id);
      const optimistic = players.map((p) =>
        p.id === id ? { ...p, ...payload, updated_at: new Date().toISOString() } as Player : p
      );
      setPlayers(optimistic);
      setEditingId(null);

      const { error } = await supabase.from("sp_players").update(payload).eq("id", id);
      if (error) {
        // Rollback
        if (prev) setPlayers(players.map((p) => (p.id === id ? prev : p)));
      }
    } else {
      // Create
      const newId = crypto.randomUUID();
      const newPlayerData: Player = {
        id: newId,
        program_id: program?.id || "",
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        squad_ids: form.squad_ids,
        cricket_type: (form.cricket_type as "male" | "female") || undefined,
        role: (form.role as PlayerRole) || undefined,
        batting_hand: (form.batting_hand as BattingHand) || undefined,
        bowling_style: (form.bowling_style as BowlingStyle) || undefined,
        club: form.club.trim() || undefined,
        dob: form.dob || undefined,
        notes: form.notes.trim() || undefined,
        is_active: form.is_active,
        created_at: new Date().toISOString(),
      };

      // Optimistic
      setPlayers([...players, newPlayerData]);
      setNewPlayer(false);
      setForm({ ...EMPTY_FORM });

      const { error } = await supabase.from("sp_players").insert({
        id: newId,
        program_id: program?.id,
        ...payload,
      });
      if (error) {
        // Rollback
        setPlayers(players.filter((p) => p.id !== newId));
      }
    }
    setSaving(false);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deletePlayer = async (id: string) => {
    const prev = [...players];
    setPlayers(players.filter((p) => p.id !== id));
    setConfirmDeleteId(null);

    const { error } = await supabase.from("sp_players").delete().eq("id", id);
    if (error) {
      setPlayers(prev);
    }
  };

  // ---- Import ----

  const parseImport = () => {
    const lines = importText.trim().split("\n").filter(Boolean);
    const rows: ImportRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Try tab-separated first, then comma-separated
      let parts = line.split("\t");
      if (parts.length < 2) {
        parts = line.split(",").map((p) => p.trim());
      }

      if (parts.length < 2) {
        errors.push(`Row ${i + 1}: Could not parse - need at least first_name and last_name`);
        continue;
      }

      const first_name = parts[0]?.trim() || "";
      const last_name = parts[1]?.trim() || "";
      const club = parts[2]?.trim() || "";
      const rawType = (parts[3]?.trim() || "").toLowerCase();
      let cricket_type: "male" | "female" | "" = "";
      if (rawType === "male" || rawType === "m") cricket_type = "male";
      else if (rawType === "female" || rawType === "f") cricket_type = "female";

      if (!first_name || !last_name) {
        errors.push(`Row ${i + 1}: Missing first or last name`);
        continue;
      }

      rows.push({ first_name, last_name, club, cricket_type });
    }

    setImportPreview(rows);
    setImportErrors(errors);
  };

  const executeImport = async () => {
    if (importPreview.length === 0) return;
    setSaving(true);

    const newPlayers: Player[] = importPreview.map((row) => ({
      id: crypto.randomUUID(),
      program_id: program?.id || "",
      first_name: row.first_name,
      last_name: row.last_name,
      squad_ids: [],
      cricket_type: row.cricket_type || undefined,
      club: row.club || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    // Optimistic
    setPlayers([...players, ...newPlayers]);

    const inserts = newPlayers.map((p) => ({
      id: p.id,
      program_id: p.program_id,
      first_name: p.first_name,
      last_name: p.last_name,
      squad_ids: p.squad_ids,
      cricket_type: p.cricket_type || null,
      club: p.club || null,
      is_active: true,
    }));

    const { error } = await supabase.from("sp_players").insert(inserts);
    if (error) {
      // Rollback
      const newIds = new Set(newPlayers.map((p) => p.id));
      setPlayers(players.filter((p) => !newIds.has(p.id)));
    } else {
      setShowImport(false);
      setImportText("");
      setImportPreview([]);
      setImportErrors([]);
    }
    setSaving(false);
  };

  // ---- Render ----

  const incompleteActivePlayers = players.filter(
    (p) => p.is_active !== false && isProfileIncomplete(p)
  );

  return (
    <div className="space-y-4">
      {/* Incomplete profile warning */}
      {incompleteActivePlayers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 font-montserrat">
              {incompleteActivePlayers.length} player{incompleteActivePlayers.length !== 1 ? "s" : ""} need profile completion
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {incompleteActivePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => startEdit(p)}
                className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 px-2 py-1 rounded-md transition"
              >
                {p.first_name} {p.last_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-6 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Total:</span>
            <span className="font-bold text-rr-charcoal dark:text-white">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Active:</span>
            <span className="font-bold text-green-600 dark:text-green-400">{stats.active}</span>
          </div>
          {ALL_ROLES.map((role) => {
            const count = stats.roleCounts[role] || 0;
            if (count === 0) return null;
            return (
              <div key={role} className="flex items-center gap-1.5">
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", ROLE_BADGE_COLOURS[role])}>
                  {ROLE_LABELS[role]}
                </span>
                <span className="font-bold text-rr-charcoal dark:text-white">{count}</span>
              </div>
            );
          })}
          {stats.incomplete > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats.incomplete} incomplete</span>
            </div>
          )}
        </div>
      </div>

      {/* Import section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-rr-charcoal dark:text-white font-montserrat">Players</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowImport(!showImport);
                setImportPreview([]);
                setImportErrors([]);
                setImportText("");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
            >
              <Upload className="w-3.5 h-3.5" /> Import Players
            </button>
            <button
              onClick={() => {
                setNewPlayer(true);
                setEditingId(null);
                setForm({ ...EMPTY_FORM });
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Player
            </button>
          </div>
        </div>

        {/* Import panel */}
        {showImport && (
          <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-rr-charcoal dark:text-white font-montserrat">
                Import Players
              </h3>
              <button onClick={() => setShowImport(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Paste CSV or tab-separated data. Format: <span className="font-mono">first_name, last_name, club, cricket_type (M/F)</span>
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"John\tSmith\tMelbourne CC\tM\nJane\tDoe\tRichmond CC\tF"}
              rows={6}
              className={cn(INPUT_CLASS, "w-full resize-none font-mono text-xs")}
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={parseImport}
                disabled={!importText.trim()}
                className="text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 disabled:opacity-40 px-3 py-1.5 rounded-lg transition"
              >
                Preview
              </button>
              {importPreview.length > 0 && (
                <button
                  onClick={executeImport}
                  disabled={saving}
                  className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 px-3 py-1.5 rounded-lg transition"
                >
                  {saving ? "Importing..." : `Import ${importPreview.length} Player${importPreview.length !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>

            {/* Import errors */}
            {importErrors.length > 0 && (
              <div className="mt-3 space-y-1">
                {importErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                ))}
              </div>
            )}

            {/* Import preview table */}
            {importPreview.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 pr-3 font-semibold text-gray-500 dark:text-gray-400">First Name</th>
                      <th className="text-left py-2 pr-3 font-semibold text-gray-500 dark:text-gray-400">Last Name</th>
                      <th className="text-left py-2 pr-3 font-semibold text-gray-500 dark:text-gray-400">Club</th>
                      <th className="text-left py-2 pr-3 font-semibold text-gray-500 dark:text-gray-400">Type</th>
                      <th className="text-left py-2 font-semibold text-gray-500 dark:text-gray-400">Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => {
                      const warnings: string[] = [];
                      if (!row.club) warnings.push("No club");
                      if (!row.cricket_type) warnings.push("No type");
                      // Imported players will always be missing role + batting hand
                      warnings.push("Missing role, batting hand");

                      return (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-1.5 pr-3 text-rr-charcoal dark:text-white">{row.first_name}</td>
                          <td className="py-1.5 pr-3 text-rr-charcoal dark:text-white">{row.last_name}</td>
                          <td className="py-1.5 pr-3 text-rr-charcoal dark:text-white">{row.club || <span className="text-amber-500">-</span>}</td>
                          <td className="py-1.5 pr-3 text-rr-charcoal dark:text-white">
                            {row.cricket_type ? (row.cricket_type === "male" ? "M" : "F") : <span className="text-amber-500">-</span>}
                          </td>
                          <td className="py-1.5">
                            {warnings.length > 0 && (
                              <span className="text-amber-600 dark:text-amber-400">{warnings.join(", ")}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(INPUT_CLASS, "w-full pl-9")}
            />
          </div>

          <div className="relative">
            <select
              value={filterSquad}
              onChange={(e) => setFilterSquad(e.target.value)}
              className={cn(INPUT_CLASS, "pr-8 appearance-none")}
            >
              <option value="all">All Squads</option>
              {squads.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={cn(INPUT_CLASS, "pr-8 appearance-none")}
            >
              <option value="all">All Roles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterCricketType}
              onChange={(e) => setFilterCricketType(e.target.value)}
              className={cn(INPUT_CLASS, "pr-8 appearance-none")}
            >
              <option value="all">M/F All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-rr-pink focus:ring-rr-pink"
            />
            Show inactive
          </label>
        </div>

        {/* Player list */}
        <div className="space-y-2">
          {filteredPlayers.length === 0 && !newPlayer && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {players.length === 0 ? "No players yet. Add a player or import from CSV." : "No players match your filters."}
            </div>
          )}

          {filteredPlayers.map((player) => (
            <div key={player.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {editingId === player.id ? (
                <PlayerForm
                  form={form}
                  setForm={setForm}
                  squads={squads}
                  onSave={() => savePlayer(player.id)}
                  onCancel={cancelEdit}
                  saving={saving}
                />
              ) : (
                <PlayerCard
                  player={player}
                  squads={squads}
                  onEdit={() => startEdit(player)}
                  onDelete={() => deletePlayer(player.id)}
                  onViewProfile={() => setProfilePlayer(player)}
                  confirmingDelete={confirmDeleteId === player.id}
                  onRequestDelete={() => setConfirmDeleteId(player.id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                />
              )}
            </div>
          ))}

          {/* New Player Form */}
          {newPlayer && (
            <div ref={newPlayerFormRef} className="border border-rr-pink/30 rounded-lg p-4 bg-pink-50/30 dark:bg-pink-900/10">
              <PlayerForm
                form={form}
                setForm={setForm}
                squads={squads}
                onSave={() => savePlayer()}
                onCancel={cancelEdit}
                saving={saving}
              />
            </div>
          )}
        </div>
      </div>

      {/* Player Profile Modal */}
      {profilePlayer && (
        <PlayerProfileModal
          player={profilePlayer}
          squads={squads}
          onClose={() => setProfilePlayer(null)}
          supabase={supabase}
        />
      )}
    </div>
  );
}

// ============================================================================
// PlayerCard — Display-only view of a single player
// ============================================================================

function PlayerCard({
  player,
  squads,
  onEdit,
  onDelete,
  onViewProfile,
  confirmingDelete,
  onRequestDelete,
  onCancelDelete,
}: {
  player: Player;
  squads: Squad[];
  onEdit: () => void;
  onDelete: () => void;
  onViewProfile: () => void;
  confirmingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
}) {
  const incomplete = isProfileIncomplete(player);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar initials */}
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            player.is_active === false
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              : "bg-rr-pink/10 text-rr-pink"
          )}
        >
          {player.first_name[0]}{player.last_name[0]}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name row with badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                "font-semibold text-sm",
                player.is_active === false
                  ? "text-gray-400 dark:text-gray-500 line-through"
                  : "text-rr-charcoal dark:text-white"
              )}
            >
              {player.first_name} {player.last_name}
            </h3>

            {/* Role badge */}
            {player.role && (
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", ROLE_BADGE_COLOURS[player.role])}>
                {ROLE_LABELS[player.role]}
              </span>
            )}

            {/* Cricket type badge */}
            {player.cricket_type && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {player.cricket_type === "male" ? "M" : "F"}
              </span>
            )}

            {/* Batting hand */}
            {player.batting_hand && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {player.batting_hand === "right" ? "R" : "L"}-hand
              </span>
            )}

            {/* Bowling style */}
            {player.bowling_style && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {BOWLING_STYLE_LABELS[player.bowling_style]}
              </span>
            )}

            {/* Inactive badge */}
            {player.is_active === false && (
              <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                Inactive
              </span>
            )}

            {/* Incomplete profile warning */}
            {incomplete && player.is_active !== false && (
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                Profile incomplete
              </span>
            )}
          </div>

          {/* Details row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Squad badges */}
            {player.squad_ids && player.squad_ids.length > 0 && (
              <>
                {player.squad_ids.map((sid) => {
                  const squad = getSquadById(squads, sid);
                  if (!squad) return null;
                  return (
                    <span
                      key={sid}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: squad.colour }}
                    >
                      {squad.name}
                    </span>
                  );
                })}
              </>
            )}

            {/* Club */}
            {player.club && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{player.club}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {incomplete && player.is_active !== false && (
          <button
            onClick={onEdit}
            className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2 py-1 rounded-md transition mr-1"
          >
            Complete Profile
          </button>
        )}
        {confirmingDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-red-500 font-medium mr-1">Delete?</span>
            <button onClick={onDelete} className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition">
              Yes
            </button>
            <button onClick={onCancelDelete} className="text-[10px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition">
              No
            </button>
          </div>
        ) : (
          <>
            <button onClick={onViewProfile} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition" title="View Profile">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button onClick={onEdit} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition" title="Edit">
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button onClick={onRequestDelete} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition" title="Delete">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PlayerForm — Inline create/edit form
// ============================================================================

function PlayerForm({
  form,
  setForm,
  squads,
  onSave,
  onCancel,
  saving,
}: {
  form: PlayerFormData;
  setForm: (f: PlayerFormData) => void;
  squads: Squad[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const showBowlingStyle = form.role === "bowler" || form.role === "all_rounder";

  return (
    <div className="space-y-3">
      {/* Row 1: Names */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="First name *"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          className={INPUT_CLASS}
        />
        <input
          type="text"
          placeholder="Last name *"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      {/* Row 2: Role, Cricket Type, Batting Hand */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative">
          <select
            value={form.role}
            onChange={(e) => {
              const newRole = e.target.value as PlayerRole | "";
              const clearBowling = newRole !== "bowler" && newRole !== "all_rounder";
              setForm({
                ...form,
                role: newRole,
                bowling_style: clearBowling ? "" : form.bowling_style,
              });
            }}
            className={cn(INPUT_CLASS, "w-full pr-8 appearance-none")}
          >
            <option value="">Select role</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={form.cricket_type}
            onChange={(e) => setForm({ ...form, cricket_type: e.target.value as "male" | "female" | "" })}
            className={cn(INPUT_CLASS, "w-full pr-8 appearance-none")}
          >
            <option value="">Cricket type</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={form.batting_hand}
            onChange={(e) => setForm({ ...form, batting_hand: e.target.value as BattingHand | "" })}
            className={cn(INPUT_CLASS, "w-full pr-8 appearance-none")}
          >
            <option value="">Batting hand</option>
            <option value="right">Right Hand</option>
            <option value="left">Left Hand</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Row 3: Bowling style (conditional) */}
      {showBowlingStyle && (
        <div className="relative">
          <select
            value={form.bowling_style}
            onChange={(e) => setForm({ ...form, bowling_style: e.target.value as BowlingStyle | "" })}
            className={cn(INPUT_CLASS, "w-full pr-8 appearance-none")}
          >
            <option value="">Select bowling style</option>
            {ALL_BOWLING_STYLES.map((bs) => (
              <option key={bs} value={bs}>{BOWLING_STYLE_FULL_LABELS[bs]} ({BOWLING_STYLE_LABELS[bs]})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Row 4: Club + DOB */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Club"
          value={form.club}
          onChange={(e) => setForm({ ...form, club: e.target.value })}
          className={INPUT_CLASS}
        />
        <input
          type="date"
          placeholder="Date of birth"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      {/* Row 5: Squad multi-select */}
      {squads.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Squads</p>
          <div className="flex flex-wrap gap-2">
            {squads.map((squad) => {
              const selected = form.squad_ids.includes(squad.id);
              return (
                <label
                  key={squad.id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer border transition",
                    selected
                      ? "border-transparent text-white"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  style={selected ? { backgroundColor: squad.colour } : undefined}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const newIds = selected
                        ? form.squad_ids.filter((id) => id !== squad.id)
                        : [...form.squad_ids, squad.id];
                      setForm({ ...form, squad_ids: newIds });
                    }}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      selected ? "bg-white/50" : ""
                    )}
                    style={!selected ? { backgroundColor: squad.colour } : undefined}
                  />
                  {squad.name}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 6: Notes */}
      <textarea
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        rows={2}
        className={cn(INPUT_CLASS, "w-full resize-none")}
      />

      {/* Row 7: Active + Actions */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="rounded border-gray-300 text-rr-pink focus:ring-rr-pink"
          />
          Active
        </label>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!form.first_name.trim() || !form.last_name.trim() || saving}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 disabled:opacity-40 rounded-lg transition flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
