"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Program, Phase, Squad, Coach, Player } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { PlayersTab } from "@/components/settings/PlayersTab";

type Tab = "program" | "squads" | "coaches" | "players";

export default function SettingsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("program");
  const [loading, setLoading] = useState(true);

  // Data
  const [program, setProgram] = useState<Program | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Fetch all settings data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [progRes, phaseRes, squadRes, coachRes, playerRes] = await Promise.all([
        supabase.from("sp_programs").select("*").single(),
        supabase.from("sp_phases").select("*").order("sort_order"),
        supabase.from("sp_squads").select("*").order("name"),
        supabase.from("sp_coaches").select("*").order("name"),
        supabase.from("sp_players").select("*").order("last_name"),
      ]);
      if (progRes.data) setProgram(progRes.data as Program);
      setPhases((phaseRes.data || []) as Phase[]);
      setSquads((squadRes.data || []) as Squad[]);
      setCoaches((coachRes.data || []) as Coach[]);
      setPlayers((playerRes.data || []) as Player[]);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-rr-charcoal dark:text-white font-montserrat mb-1">
        Settings
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Program, squad, player, and coach management
      </p>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {(["program", "squads", "players", "coaches"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-semibold rounded-md transition font-montserrat capitalize",
              activeTab === tab
                ? "bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "program" && (
        <ProgramTab program={program} phases={phases} setPhases={setPhases} supabase={supabase} />
      )}
      {activeTab === "squads" && (
        <SquadsTab squads={squads} setSquads={setSquads} program={program} supabase={supabase} />
      )}
      {activeTab === "players" && (
        <PlayersTab players={players} setPlayers={setPlayers} squads={squads} program={program} supabase={supabase} />
      )}
      {activeTab === "coaches" && (
        <CoachesTab coaches={coaches} setCoaches={setCoaches} supabase={supabase} />
      )}
    </div>
  );
}

// ==========================================
// PROGRAM TAB — Program info + Phase CRUD
// ==========================================
function ProgramTab({
  program,
  phases,
  setPhases,
  supabase,
}: {
  program: Program | null;
  phases: Phase[];
  setPhases: (p: Phase[]) => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [newPhase, setNewPhase] = useState(false);
  const [phaseForm, setPhaseForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    goals: "",
  });

  const startEditPhase = (phase: Phase) => {
    setEditingPhase(phase.id);
    setPhaseForm({
      name: phase.name,
      description: phase.description || "",
      start_date: phase.start_date,
      end_date: phase.end_date,
      goals: Array.isArray(phase.goals) ? (phase.goals as string[]).join("\n") : "",
    });
  };

  const savePhase = async (id?: string) => {
    const goalsArray = phaseForm.goals
      .split("\n")
      .map((g) => g.trim())
      .filter(Boolean);

    if (id) {
      // Update
      const { data, error } = await supabase
        .from("sp_phases")
        .update({
          name: phaseForm.name,
          description: phaseForm.description,
          start_date: phaseForm.start_date,
          end_date: phaseForm.end_date,
          goals: goalsArray,
        })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        setPhases(phases.map((p) => (p.id === id ? (data as Phase) : p)));
        setEditingPhase(null);
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from("sp_phases")
        .insert({
          name: phaseForm.name,
          description: phaseForm.description,
          start_date: phaseForm.start_date,
          end_date: phaseForm.end_date,
          goals: goalsArray,
          program_id: program?.id,
          sort_order: phases.length + 1,
        })
        .select()
        .single();
      if (!error && data) {
        setPhases([...phases, data as Phase]);
        setNewPhase(false);
        setPhaseForm({ name: "", description: "", start_date: "", end_date: "", goals: "" });
      }
    }
  };

  const deletePhase = async (id: string) => {
    const { error } = await supabase.from("sp_phases").delete().eq("id", id);
    if (!error) {
      setPhases(phases.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Program Info */}
      {program && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-bold text-rr-charcoal dark:text-white font-montserrat mb-3">
            {program.name}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Start Date</span>
              <p className="font-medium text-rr-charcoal dark:text-white">
                {new Date(program.start_date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">End Date</span>
              <p className="font-medium text-rr-charcoal dark:text-white">
                {new Date(program.end_date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phases */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-rr-charcoal dark:text-white font-montserrat">
            Program Phases
          </h2>
          <button
            onClick={() => {
              setNewPhase(true);
              setPhaseForm({ name: "", description: "", start_date: "", end_date: "", goals: "" });
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 px-3 py-1.5 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Phase
          </button>
        </div>

        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {editingPhase === phase.id ? (
                <PhaseForm
                  form={phaseForm}
                  setForm={setPhaseForm}
                  onSave={() => savePhase(phase.id)}
                  onCancel={() => setEditingPhase(null)}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-rr-charcoal dark:text-white">{phase.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(phase.start_date + "T00:00:00").toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                      {" — "}
                      {new Date(phase.end_date + "T00:00:00").toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                    </p>
                    {phase.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{phase.description}</p>
                    )}
                    {Array.isArray(phase.goals) && (phase.goals as string[]).length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {(phase.goals as string[]).map((goal, i) => (
                          <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                            <span className="text-rr-pink mt-0.5">-</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditPhase(phase)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
                      <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => deletePhase(phase.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* New Phase Form */}
          {newPhase && (
            <div className="border border-rr-pink/30 rounded-lg p-4 bg-pink-50/30 dark:bg-pink-900/10">
              <PhaseForm
                form={phaseForm}
                setForm={setPhaseForm}
                onSave={() => savePhase()}
                onCancel={() => setNewPhase(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseForm({
  form,
  setForm,
  onSave,
  onCancel,
}: {
  form: { name: string; description: string; start_date: string; end_date: string; goals: string };
  setForm: (f: typeof form) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Phase name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
      />
      <input
        type="text"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
        />
        <input
          type="date"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
        />
      </div>
      <textarea
        placeholder="Goals (one per line)"
        value={form.goals}
        onChange={(e) => setForm({ ...form, goals: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none resize-none"
      />
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          Cancel
        </button>
        <button onClick={onSave} className="px-3 py-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 rounded-lg transition flex items-center gap-1">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    </div>
  );
}

// ==========================================
// SQUADS TAB — Squad CRUD
// ==========================================
function SquadsTab({
  squads,
  setSquads,
  program,
  supabase,
}: {
  squads: Squad[];
  setSquads: (s: Squad[]) => void;
  program: Program | null;
  supabase: ReturnType<typeof createClient>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSquad, setNewSquad] = useState(false);
  const [form, setForm] = useState({ name: "", colour: "#E11F8F", description: "", max_players: "12" });

  const startEdit = (squad: Squad) => {
    setEditingId(squad.id);
    setForm({
      name: squad.name,
      colour: squad.colour,
      description: squad.description || "",
      max_players: String(squad.max_players || 12),
    });
  };

  const save = async (id?: string) => {
    const payload = {
      name: form.name,
      colour: form.colour,
      description: form.description,
      max_players: parseInt(form.max_players) || 12,
      program_id: program?.id,
    };

    if (id) {
      const { data, error } = await supabase.from("sp_squads").update(payload).eq("id", id).select().single();
      if (!error && data) {
        setSquads(squads.map((s) => (s.id === id ? (data as Squad) : s)));
        setEditingId(null);
      }
    } else {
      const { data, error } = await supabase.from("sp_squads").insert(payload).select().single();
      if (!error && data) {
        setSquads([...squads, data as Squad]);
        setNewSquad(false);
        setForm({ name: "", colour: "#E11F8F", description: "", max_players: "12" });
      }
    }
  };

  const deleteSquad = async (id: string) => {
    const { error } = await supabase.from("sp_squads").delete().eq("id", id);
    if (!error) setSquads(squads.filter((s) => s.id !== id));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-rr-charcoal dark:text-white font-montserrat">Squads</h2>
        <button
          onClick={() => {
            setNewSquad(true);
            setForm({ name: "", colour: "#E11F8F", description: "", max_players: "12" });
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 px-3 py-1.5 rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Squad
        </button>
      </div>

      <div className="space-y-3">
        {squads.map((squad) => (
          <div key={squad.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {editingId === squad.id ? (
              <SquadForm form={form} setForm={setForm} onSave={() => save(squad.id)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: squad.colour }}>
                    {squad.name.replace("Squad ", "")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-rr-charcoal dark:text-white text-sm">{squad.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {squad.description} - Max {squad.max_players} players
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(squad)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => deleteSquad(squad.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {newSquad && (
          <div className="border border-rr-pink/30 rounded-lg p-4 bg-pink-50/30 dark:bg-pink-900/10">
            <SquadForm form={form} setForm={setForm} onSave={() => save()} onCancel={() => setNewSquad(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

function SquadForm({
  form,
  setForm,
  onSave,
  onCancel,
}: {
  form: { name: string; colour: string; description: string; max_players: string };
  setForm: (f: typeof form) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={form.colour}
          onChange={(e) => setForm({ ...form, colour: e.target.value })}
          className="w-10 h-10 rounded-lg cursor-pointer border-0"
        />
        <input
          type="text"
          placeholder="Squad name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
        />
      </div>
      <input
        type="text"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
      />
      <input
        type="number"
        placeholder="Max players"
        value={form.max_players}
        onChange={(e) => setForm({ ...form, max_players: e.target.value })}
        className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
      />
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          Cancel
        </button>
        <button onClick={onSave} className="px-3 py-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 rounded-lg transition flex items-center gap-1">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    </div>
  );
}

// ==========================================
// COACHES TAB — Coach CRUD
// ==========================================
function CoachesTab({
  coaches,
  setCoaches,
  supabase,
}: {
  coaches: Coach[];
  setCoaches: (c: Coach[]) => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCoach, setNewCoach] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "assistant_coach", speciality: "", is_active: true });

  const startEdit = (coach: Coach) => {
    setEditingId(coach.id);
    setForm({
      name: coach.name,
      email: coach.email || "",
      role: coach.role,
      speciality: coach.speciality || "",
      is_active: coach.is_active,
    });
  };

  const save = async (id?: string) => {
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      speciality: form.speciality,
      is_active: form.is_active,
    };

    if (id) {
      const { data, error } = await supabase.from("sp_coaches").update(payload).eq("id", id).select().single();
      if (!error && data) {
        setCoaches(coaches.map((c) => (c.id === id ? (data as Coach) : c)));
        setEditingId(null);
      }
    } else {
      const { data, error } = await supabase.from("sp_coaches").insert(payload).select().single();
      if (!error && data) {
        setCoaches([...coaches, data as Coach]);
        setNewCoach(false);
        setForm({ name: "", email: "", role: "assistant_coach", speciality: "", is_active: true });
      }
    }
  };

  const deleteCoach = async (id: string) => {
    const { error } = await supabase.from("sp_coaches").delete().eq("id", id);
    if (!error) setCoaches(coaches.filter((c) => c.id !== id));
  };

  const roleLabels: Record<string, string> = {
    head_coach: "Head Coach",
    assistant_coach: "Assistant Coach",
    guest_coach: "Guest Coach",
    player: "Player",
  };

  const roleBadgeColors: Record<string, string> = {
    head_coach: "bg-rr-pink text-white",
    assistant_coach: "bg-rr-blue text-white",
    guest_coach: "bg-rr-medium-blue text-white",
    player: "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-rr-charcoal dark:text-white font-montserrat">Coaching Staff</h2>
        <button
          onClick={() => {
            setNewCoach(true);
            setForm({ name: "", email: "", role: "assistant_coach", speciality: "", is_active: true });
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 px-3 py-1.5 rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Coach
        </button>
      </div>

      <div className="space-y-3">
        {coaches.map((coach) => (
          <div key={coach.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {editingId === coach.id ? (
              <CoachForm form={form} setForm={setForm} onSave={() => save(coach.id)} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rr-blue/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-rr-blue">
                      {coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-rr-charcoal dark:text-white text-sm">{coach.name}</h3>
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", roleBadgeColors[coach.role] || "bg-gray-200")}>
                        {roleLabels[coach.role] || coach.role}
                      </span>
                      {!coach.is_active && (
                        <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {coach.speciality && `${coach.speciality} - `}{coach.email || "No email"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(coach)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => deleteCoach(coach.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {newCoach && (
          <div className="border border-rr-pink/30 rounded-lg p-4 bg-pink-50/30 dark:bg-pink-900/10">
            <CoachForm form={form} setForm={setForm} onSave={() => save()} onCancel={() => setNewCoach(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

function CoachForm({
  form,
  setForm,
  onSave,
  onCancel,
}: {
  form: { name: string; email: string; role: string; speciality: string; is_active: boolean };
  setForm: (f: typeof form) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
        >
          <option value="head_coach">Head Coach</option>
          <option value="assistant_coach">Assistant Coach</option>
          <option value="guest_coach">Guest Coach</option>
          <option value="player">Player</option>
        </select>
        <input
          type="text"
          placeholder="Speciality (e.g., Batting)"
          value={form.speciality}
          onChange={(e) => setForm({ ...form, speciality: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-rr-charcoal dark:text-white focus:ring-1 focus:ring-rr-pink outline-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="rounded border-gray-300 text-rr-pink focus:ring-rr-pink"
        />
        Active
      </label>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          Cancel
        </button>
        <button onClick={onSave} className="px-3 py-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 rounded-lg transition flex items-center gap-1">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    </div>
  );
}
