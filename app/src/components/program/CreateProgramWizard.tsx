"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProgram } from "@/lib/program-context";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateProgramWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProgramWizard({ isOpen, onClose }: CreateProgramWizardProps) {
  const supabase = createClient();
  const { refreshPrograms, setActiveProgram } = useProgram();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      toast.error("Please fill in name, start date, and end date");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        setSaving(false);
        return;
      }

      // Create the program
      const { data: program, error: progError } = await supabase
        .from("sp_programs")
        .insert({
          name: form.name,
          description: form.description || null,
          start_date: form.start_date,
          end_date: form.end_date,
        })
        .select()
        .single();

      if (progError || !program) {
        toast.error("Failed to create program: " + (progError?.message ?? "Unknown error"));
        setSaving(false);
        return;
      }

      // Add the creator as head_coach
      const { error: memberError } = await supabase
        .from("sp_program_members")
        .insert({
          program_id: program.id,
          user_id: user.id,
          role: "head_coach",
          status: "active",
          accepted_at: new Date().toISOString(),
        });

      if (memberError) {
        toast.error("Program created but failed to add membership: " + memberError.message);
        setSaving(false);
        return;
      }

      toast.success(`"${form.name}" created!`);

      // Refresh programs and switch to the new one
      await refreshPrograms();
      setActiveProgram(program.id);

      // Reset form and close
      setForm({ name: "", description: "", start_date: "", end_date: "" });
      onClose();
    } catch (err) {
      toast.error("Unexpected error creating program");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-rr-charcoal dark:text-white">
            Create New Program
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              Program Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Cutting Edge Cricket Centre Elite 2026"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-rr-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-rr-blue/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the program..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-rr-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-rr-blue/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                Start Date *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-rr-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-rr-blue/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                End Date *
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-rr-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-rr-blue/50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rr-blue rounded-lg hover:bg-rr-blue/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Creating..." : "Create Program"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
