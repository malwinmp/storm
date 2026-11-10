import { useEffect, useState } from "react";

const STORAGE_KEY = "storm-view-preferences";

const defaults = {
  state: "All",
  labelFilters: {},
  sort: "TimeAdded",
  sortReverse: true,
};

function readPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      state: typeof stored.state === "string" ? stored.state : defaults.state,
      sort: typeof stored.sort === "string" ? stored.sort : defaults.sort,
      sortReverse:
        typeof stored.sortReverse === "boolean"
          ? stored.sortReverse
          : defaults.sortReverse,
      labelFilters:
        stored.labelFilters && typeof stored.labelFilters === "object"
          ? stored.labelFilters
          : defaults.labelFilters,
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
