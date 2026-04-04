"use client";

import { useState, useEffect } from "react";
import { Session, Squad, SpecialistCoach, SessionStatus } from "@/lib/types";

import { cn } from "@/lib/utils";

interface SessionMetadataEditorProps {
  session: Session;
  squads: Squad[];
  onUpdate: (updates: Partial<Session>) => Promise<void>;
}

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  }
}

const STATUS_OPTIONS: { value: SessionStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-yellow-100 text-yellow-800" },
  { value: "published", label: "Published", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-800" },
];

export function SessionMetadataEditor({ session, squads, onUpdate }: SessionMetadataEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editDate, setEditDate] = useState(session.date);
  const [editStartTime, setEditStartTime] = useState(session.start_time.slice(0, 5));
  const [editEndTime, setEditEndTime] = useState(session.end_time.slice(0, 5));
  const [editSquadIds, setEditSquadIds] = useState<string[]>(session.squad_ids);
  const [editStatus, setEditStatus] = useState<SessionStatus>(session.status);
  const [editCoaches, setEditCoaches] = useState<SpecialistCoach[]>(session.specialist_coaches || []);
  const [saving, setSaving] = useState(false);

  // Sync state when session changes externally
  useEffect(() => {
    setEditDate(session.date);
    setEditStartTime(session.start_time.slice(0, 5));
    setEditEndTime(session.end_time.slice(0, 5));
    setEditSquadIds(session.squad_ids);
    setEditStatus(session.status);
    setEditCoaches(session.specialist_coaches || []);
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        date: editDate,
        start_time: editStartTime + ":00",
        end_time: editEndTime + ":00",
        squad_ids: editSquadIds,
        status: editStatus,
        specialist_coaches: editCoaches,
      });
      setIsExpanded(false);
    } catch (err) {
      console.error("Failed to save session metadata:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSquad = (squadId: string) => {
    setEditSquadIds((prev) =>
      prev.includes(squadId) ? prev.filter((id) => id !== squadId) : [...prev, squadId]
    );
  };

  const addCoach = () => {
    setEditCoaches((prev) => [...prev, { name: "", role: "" }]);
  };

  const updateCoach = (index: number, field: keyof SpecialistCoach, value: string) => {
    setEditCoaches((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const removeCoach = (index: number) => {
    setEditCoaches((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTimeDisplay = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "pm" : "am";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    if (m === 0) return `${displayH}${period}`;
    return `${displayH}:${m.toString().padStart(2, "0")}${period}`;
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-rr-blue transition px-1.5 py-0.5 rounded hover:bg-blue-50"
        title="Edit session details"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit
      </button>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Edit Session Details</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Date & Time row */}
      <div className="flex items-center gap-3">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="block w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 focus:ring-1 focus:ring-rr-pink dark:bg-gray-700 dark:text-white focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Start</label>
          <select
            value={editStartTime}
            onChange={(e) => setEditStartTime(e.target.value)}
            className="block text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 focus:ring-1 focus:ring-rr-pink dark:bg-gray-700 dark:text-white"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{formatTimeDisplay(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">End</label>
          <select
            value={editEndTime}
            onChange={(e) => setEditEndTime(e.target.value)}
            className="block text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 focus:ring-1 focus:ring-rr-pink dark:bg-gray-700 dark:text-white"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{formatTimeDisplay(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as SessionStatus)}
            className="block text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 focus:ring-1 focus:ring-rr-pink dark:bg-gray-700 dark:text-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Squads */}
      <div>
        <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Squads</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {squads.map((squad) => (
            <button
              key={squad.id}
              onClick={() => toggleSquad(squad.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition border-2",
                editSquadIds.includes(squad.id)
                  ? "text-white border-transparent"
                  : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400"
              )}
              style={editSquadIds.includes(squad.id) ? { backgroundColor: squad.colour, borderColor: squad.colour } : undefined}
            >
              {squad.name}
            </button>
          ))}
        </div>
      </div>

      {/* Specialist Coaches */}
      <div>
        <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Specialist Coaches</label>
        <div className="space-y-1.5 mt-1">
          {editCoaches.map((coach, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={coach.name}
                onChange={(e) => updateCoach(idx, "name", e.target.value)}
                placeholder="Name"
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-1 focus:ring-rr-pink focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                value={coach.role}
                onChange={(e) => updateCoach(idx, "role", e.target.value)}
                placeholder="Role"
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-1 focus:ring-rr-pink focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => removeCoach(idx)}
                className="text-red-400 hover:text-red-600 transition p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={addCoach}
            className="text-xs text-rr-blue hover:text-rr-blue/80 font-medium transition"
          >
            + Add Specialist Coach
          </button>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={() => setIsExpanded(false)}
          className="px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
