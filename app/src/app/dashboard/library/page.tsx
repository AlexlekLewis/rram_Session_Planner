"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, TierDetail, GamifyDetail, CoachingFramework, BlockCategory } from "@/lib/types";
import { CATEGORY_COLOURS, CATEGORY_LABELS, ALL_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ActivityFormData = Omit<Activity, "id" | "created_at" | "updated_at">;

const emptyTierDetail: TierDetail = {
  description: undefined,
  coaching_points: undefined,
  equipment: undefined,
};

const emptyGamifyDetail: GamifyDetail = {
  description: undefined,
  coaching_points: undefined,
  equipment: undefined,
  scoring_rules: undefined,
  consequence: undefined,
};

const emptyCoachingFramework: CoachingFramework = {
  gfr_focus: undefined,
  kinetic_chain_focus: undefined,
  intent_clarity: undefined,
};

const emptyFormData: ActivityFormData = {
  name: "",
  category: "other",
  sub_category: undefined,
  description: undefined,
  regression: emptyTierDetail,
  progression: emptyTierDetail,
  elite: emptyTierDetail,
  gamify: emptyGamifyDetail,
  default_duration_mins: 15,
  default_lanes: 1,
  equipment: [],
  tags: [],
  youtube_reference: undefined,
  constraints_cla: undefined,
  coaching_framework: emptyCoachingFramework,
  max_balls_per_batter: undefined,
  between_sets_activity: undefined,
  created_by: undefined,
  is_global: true,
};

export default function LibraryPage() {
  const supabase = createClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>(emptyFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, [supabase]);

  async function loadActivities() {
    setLoading(true);
    const { data } = await supabase
      .from("sp_activities")
      .select("*")
      .order("category")
      .order("name");
    setActivities((data as Activity[]) || []);
    setLoading(false);
  }

  const filtered = activities.filter((a) => {
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openAddModal() {
    setEditingId(null);
    setFormData(emptyFormData);
    setShowModal(true);
  }

  function openEditModal(activity: Activity) {
    setEditingId(activity.id);
    setFormData({
      name: activity.name,
      category: activity.category,
      sub_category: activity.sub_category,
      description: activity.description,
      regression: activity.regression,
      progression: activity.progression,
      elite: activity.elite,
      gamify: activity.gamify,
      default_duration_mins: activity.default_duration_mins,
      default_lanes: activity.default_lanes,
      equipment: activity.equipment,
      tags: activity.tags,
      youtube_reference: activity.youtube_reference,
      constraints_cla: activity.constraints_cla,
      coaching_framework: activity.coaching_framework,
      max_balls_per_batter: activity.max_balls_per_batter,
      between_sets_activity: activity.between_sets_activity,
      created_by: activity.created_by,
      is_global: activity.is_global,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert("Activity name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing activity
        const { error } = await supabase
          .from("sp_activities")
          .update(formData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        // Create new activity
        const { error } = await supabase
          .from("sp_activities")
          .insert([formData]);
        if (error) throw error;
      }
      setShowModal(false);
      loadActivities();
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Error saving activity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("sp_activities")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setDeleteConfirm(null);
      loadActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Error deleting activity. Please try again.");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateTierDetail(tier: "regression" | "progression" | "elite" | "gamify", field: string, value: any) {
    const tierData = formData[tier];
    if (field === "coaching_points" || field === "equipment") {
      // Parse comma-separated strings to arrays
      const arrayValue = typeof value === "string" ? value.split(",").map((s) => s.trim()).filter(Boolean) : value;
      setFormData({
        ...formData,
        [tier]: { ...tierData, [field]: arrayValue },
      });
    } else {
      setFormData({
        ...formData,
        [tier]: { ...tierData, [field]: value },
      });
    }
  }

  function updateCoachingFramework(field: string, value: string) {
    setFormData({
      ...formData,
      coaching_framework: { ...formData.coaching_framework, [field]: value || undefined },
    });
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-rr-charcoal" style={{ fontFamily: "Montserrat" }}>
            Activity Library
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activities.length} activities with R/P/E/G tier variants
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-lg font-medium text-white transition-all"
          style={{
            backgroundColor: "#E11F8F",
            fontFamily: "Montserrat",
          }}
        >
          + Add Activity
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-rr-pink/20 focus:border-rr-pink bg-white dark:bg-gray-700 dark:text-white"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-pink/20 bg-white dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Categories</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Activity Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No activities found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((activity) => (
            <div
              key={activity.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                  style={{
                    backgroundColor:
                      CATEGORY_COLOURS[activity.category as keyof typeof CATEGORY_COLOURS] ||
                      "#D4D4D8",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-rr-charcoal dark:text-white truncate">
                    {activity.name}
                  </h3>
                  {activity.sub_category && (
                    <p className="text-xs text-gray-400 mt-0.5">{activity.sub_category}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {activity.description || "No description"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {(["R", "P", "E", "G"] as const).map((tier) => {
                      const tierData =
                        tier === "R"
                          ? activity.regression
                          : tier === "P"
                          ? activity.progression
                          : tier === "E"
                          ? activity.elite
                          : activity.gamify;
                      const hasData = tierData && tierData.description;
                      return (
                        <span
                          key={tier}
                          className={cn(
                            "text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center",
                            hasData
                              ? "bg-gray-100 text-gray-600"
                              : "bg-gray-50 text-gray-300"
                          )}
                        >
                          {tier}
                        </span>
                      );
                    })}
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {activity.default_duration_mins}min
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => openEditModal(activity)}
                  className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(activity.id)}
                  className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === activity.id && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700 font-medium mb-2">Delete this activity?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="flex-1 px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-2 py-1 text-xs font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-rr-charcoal" style={{ fontFamily: "Montserrat" }}>
              {editingId ? "Edit Activity" : "Add Activity"}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold text-rr-charcoal mb-3" style={{ fontFamily: "Montserrat" }}>
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white focus:border-rr-pink"
                    placeholder="e.g., Power Drive Drill"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as BlockCategory })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sub-Category
                    </label>
                    <input
                      type="text"
                      value={formData.sub_category || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, sub_category: e.target.value || undefined })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Activity description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Duration (mins)
                    </label>
                    <input
                      type="number"
                      value={formData.default_duration_mins}
                      onChange={(e) =>
                        setFormData({ ...formData, default_duration_mins: parseInt(e.target.value) || 15 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Lanes
                    </label>
                    <input
                      type="number"
                      value={formData.default_lanes}
                      onChange={(e) =>
                        setFormData({ ...formData, default_lanes: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Equipment (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(formData.equipment) ? formData.equipment.join(", ") : (formData.equipment || "")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        equipment: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="bat, ball, cones"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(formData.tags) ? formData.tags.join(", ") : (formData.tags || "")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., power, strength, technique"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-rr-pink focus:ring-rr-pink/20"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Activity</span>
                </label>
              </div>
            </div>

            {/* Tier Details */}
            {(["regression", "progression", "elite", "gamify"] as const).map((tier) => (
              <TierSection
                key={tier}
                tier={tier}
                tierData={formData[tier]}
                onUpdate={updateTierDetail}
              />
            ))}

            {/* Coaching Framework */}
            <div>
              <h3 className="font-semibold text-rr-charcoal mb-3" style={{ fontFamily: "Montserrat" }}>
                Coaching Framework
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GFR Focus
                  </label>
                  <input
                    type="text"
                    value={formData.coaching_framework.gfr_focus || ""}
                    onChange={(e) => updateCoachingFramework("gfr_focus", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kinetic Chain Focus
                  </label>
                  <input
                    type="text"
                    value={formData.coaching_framework.kinetic_chain_focus || ""}
                    onChange={(e) => updateCoachingFramework("kinetic_chain_focus", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Intent Clarity
                  </label>
                  <input
                    type="text"
                    value={formData.coaching_framework.intent_clarity || ""}
                    onChange={(e) => updateCoachingFramework("intent_clarity", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div>
              <h3 className="font-semibold text-rr-charcoal mb-3" style={{ fontFamily: "Montserrat" }}>
                Additional Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    YouTube Reference URL
                  </label>
                  <input
                    type="text"
                    value={formData.youtube_reference || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, youtube_reference: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Balls Per Batter
                  </label>
                  <input
                    type="number"
                    value={formData.max_balls_per_batter || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_balls_per_batter: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Between Sets Activity
                  </label>
                  <input
                    type="text"
                    value={formData.between_sets_activity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        between_sets_activity: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Constraints / CLA
                  </label>
                  <textarea
                    value={formData.constraints_cla || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, constraints_cla: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "#E11F8F",
                  fontFamily: "Montserrat",
                }}
              >
                {submitting ? "Saving..." : editingId ? "Update Activity" : "Create Activity"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TierSectionProps {
  tier: "regression" | "progression" | "elite" | "gamify";
  tierData: TierDetail | GamifyDetail;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (tier: "regression" | "progression" | "elite" | "gamify", field: string, value: any) => void;
}

function TierSection({ tier, tierData, onUpdate }: TierSectionProps) {
  const tierLabels = {
    regression: "Regression Tier",
    progression: "Progression Tier",
    elite: "Elite Tier",
    gamify: "Gamify Tier",
  };

  return (
    <div>
      <h3 className="font-semibold text-rr-charcoal mb-3" style={{ fontFamily: "Montserrat" }}>
        {tierLabels[tier]}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={tierData.description || ""}
            onChange={(e) => onUpdate(tier, "description", e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
            placeholder="Optional"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Coaching Points (comma-separated)
          </label>
          <textarea
            value={Array.isArray(tierData.coaching_points) ? tierData.coaching_points.join(", ") : (tierData.coaching_points || "")}
            onChange={(e) => onUpdate(tier, "coaching_points", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
            placeholder="Optional"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Equipment (comma-separated)
          </label>
          <input
            type="text"
            value={Array.isArray(tierData.equipment) ? tierData.equipment.join(", ") : (tierData.equipment || "")}
            onChange={(e) => onUpdate(tier, "equipment", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
            placeholder="Optional"
          />
        </div>

        {tier === "gamify" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scoring Rules
              </label>
              <textarea
                value={(tierData as GamifyDetail).scoring_rules || ""}
                onChange={(e) => onUpdate(tier, "scoring_rules", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                placeholder="Optional"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Consequence
              </label>
              <textarea
                value={(tierData as GamifyDetail).consequence || ""}
                onChange={(e) => onUpdate(tier, "consequence", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rr-pink/20 dark:bg-gray-700 dark:text-white"
                placeholder="Optional"
                rows={2}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
