import { useEffect, useState } from "react";

const STORAGE_KEY = "storm-view-preferences";

const defaults = {
  state: "All",
  labelFilters: {},
  sort: "TimeAdded",
  reverse: true,
  activeViewFilterName: "",
};

function readPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...defaults,
      ...stored,
      labelFilters:
        stored.labelFilters && typeof stored.labelFilters === "object"
          ? stored.labelFilters
          : {},
      activeViewFilterName:
        typeof (stored.activeViewFilterName ?? stored.activeFilterName) === "string"
          ? (stored.activeViewFilterName ?? stored.activeFilterName)
          : "",
    };
  } catch {
    return defaults;
  }
}

export function useViewPreferences() {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // View preferences are optional when browser storage is unavailable.
    }
  }, [preferences]);

  return [preferences, setPreferences];
}
