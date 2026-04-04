"use client";

import { useEffect, useState } from "react";
import { Activity } from "@/lib/types";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ActivityCard } from "./ActivityCard";
import { ActivityFilter } from "./ActivityFilter";
import { X, Search } from "lucide-react";

interface LibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDragStart: (activity: Activity, e: React.DragEvent) => void;
}

export function LibraryPanel({ isOpen, onClose, onDragStart }: LibraryPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTiers, setActiveTiers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities on mount
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const client = createClient();
        const { data, error: err } = await client
          .from("sp_activities")
          .select("*")
          .eq("is_global", true)
          .order("name");

        if (err) {
          setError(err.message);
          return;
        }

        setActivities(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      activity.name.toLowerCase().includes(searchLower) ||
      (activity.sub_category?.toLowerCase().includes(searchLower) ?? false) ||
      (activity.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ?? false);

    if (!matchesSearch) return false;

    // Category filter
    if (selectedCategory !== "all" && activity.category !== selectedCategory) {
      return false;
    }

    // Tier filter
    if (activeTiers.size > 0) {
      const hasTierData = Array.from(activeTiers).some((tier) => {
        if (tier === "R" && activity.regression && Object.keys(activity.regression).length > 0) return true;
        if (tier === "P" && activity.progression && Object.keys(activity.progression).length > 0) return true;
        if (tier === "E" && activity.elite && Object.keys(activity.elite).length > 0) return true;
        if (tier === "G" && activity.gamify && Object.keys(activity.gamify).length > 0) return true;
        return false;
      });
      if (!hasTierData) return false;
    }

    return true;
  });

  const handleTierToggle = (tier: string) => {
    const newTiers = new Set(activeTiers);
    if (newTiers.has(tier)) {
      newTiers.delete(tier);
    } else {
      newTiers.add(tier);
    }
    setActiveTiers(newTiers);
  };

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl z-30",
        "transform transition-transform duration-300 ease-in-out",
        "flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Library</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Close library"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-lg",
              "border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
              "bg-white dark:bg-gray-700 text-sm placeholder-gray-400 dark:text-white",
              "outline-none transition-colors"
            )}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <ActivityFilter
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
          activeTiers={activeTiers}
          onTierToggle={handleTierToggle}
        />
      </div>

      {/* Activity Count */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
        {filteredActivities.length} of {activities.length} activities
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">Loading activities...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No activities found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
