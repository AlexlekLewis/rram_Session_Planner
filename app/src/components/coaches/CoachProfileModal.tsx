"use client";

import { useState } from "react";
import { ProgramMember } from "@/lib/types";

interface CoachProfileModalProps {
  coach: ProgramMember;
  onSave: (memberId: string, updates: { display_name?: string; phone?: string; speciality?: string }) => Promise<unknown>;
  onClose: () => void;
  canEdit: boolean;
}

const SPECIALITIES = [
  "Batting",
  "Pace Bowling",
  "Spin Bowling",
  "Wicketkeeping",
  "Fielding",
  "Fitness & Conditioning",
  "Mental Performance",
  "All-Round",
];

export function CoachProfileModal({ coach, onSave, onClose, canEdit }: CoachProfileModalProps) {
  const [displayName, setDisplayName] = useState(coach.display_name || "");
  const [phone, setPhone] = useState(coach.phone || "");
  const [speciality, setSpeciality] = useState(coach.speciality || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(coach.id, {
      display_name: displayName || undefined,
      phone: phone || undefined,
      speciality: speciality || undefined,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">Coach Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-blue/50 disabled:bg-gray-50"
              placeholder="Coach name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-blue/50 disabled:bg-gray-50"
              placeholder="0400 000 000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Speciality</label>
            <select
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-blue/50 disabled:bg-gray-50"
            >
              <option value="">Select speciality</option>
              {SPECIALITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">
              <span className="font-medium">Role:</span>{" "}
              {coach.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Member since:</span>{" "}
              {new Date(coach.created_at).toLocaleDateString("en-AU")}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            {canEdit ? "Cancel" : "Close"}
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm text-white bg-rr-blue rounded-lg hover:bg-rr-blue/90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
