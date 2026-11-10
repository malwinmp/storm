import { useCallback, useEffect, useState } from "react";
import { call } from "./api/client.js";
import Dialog from "./components/Dialog.jsx";
import { StatusBar } from "./components/StatusBar.jsx";
import { TorrentListView } from "./components/TorrentListView.jsx";
import { TorrentToolbar } from "./components/TorrentToolbar.jsx";
import { useTorrentData } from "./hooks/useTorrentData.js";
import { useTorrentFilters } from "./hooks/useTorrentFilters.js";
import { useViewPreferences } from "./hooks/useViewPreferences.js";

export function App() {
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");
  const [viewFilters, setViewFilters] = useState([]);
  const [viewFiltersLoaded, setViewFiltersLoaded] = useState(false);
  const [activeViewFilterName, setActiveViewFilterName] = useState("");
  const [preferences, setPreferences] = useViewPreferences();

  const notice = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const { torrents, session, disk, connected, load } = useTorrentData(notice);
  const filters = useTorrentFilters(torrents, preferences);

  useEffect(() => {
    setPreferences((current) => ({
      ...current,
      state: filters.state,
      sort: filters.sort,
      sortReverse: filters.sortReverse,
      labelFilters: filters.labelFilters,
    }));
  }, [filters.state, filters.sort, filters.sortReverse, filters.labelFilters]);

  const loadViewFilters = useCallback(async () => {
    try {
      setViewFilters((await call("view-filters")) || []);
      setViewFiltersLoaded(true);
    } catch (error) {
      notice(error.message);
    }
  }, [notice]);

  useEffect(() => { loadViewFilters(); }, [loadViewFilters]);

  useEffect(() => {
    if (!viewFiltersLoaded || !activeViewFilterName) return;
    const active = viewFilters.find(
      (filter) => filter.name === activeViewFilterName,
    );
    if (!active) setActiveViewFilterName("");
  }, [viewFiltersLoaded, viewFilters, activeViewFilterName]);

  const applyViewFilter = (filter) => {
    setActiveViewFilterName(filter.name);
    filters.setState(filter.state);
    filters.setSort(filter.sort);
    filters.setSortReverse(filter.sortReverse);
    filters.setLabelFilters(filter.labelFilters || {});
  };

  const resetView = () => {
    setActiveViewFilterName("");
    filters.setState("All");
    filters.setSort("TimeAdded");
    filters.setSortReverse(true);
    filters.setLabelFilters({});
    filters.setSearch("");
  };

  const normalizedLabels = (labels = {}) => Object.fromEntries(
    Object.entries(labels).filter(([, value]) => value === 1 || value === -1).sort(([a], [b]) => a.localeCompare(b)),
  );
  const hasViewFilterChanges = (viewFilter) => JSON.stringify({
    state: viewFilter.state,
    sort: viewFilter.sort,
    sortReverse: viewFilter.sortReverse,
    labelFilters: normalizedLabels(viewFilter.labelFilters),
  }) !== JSON.stringify({
    state: filters.state,
    sort: filters.sort,
    sortReverse: filters.sortReverse,
    labelFilters: normalizedLabels(filters.labelFilters),
  });
  const updateActiveViewFilter = async (viewFilter) => {
    if (!hasViewFilterChanges(viewFilter)) return;
    const settings = {
      state: filters.state,
      sort: filters.sort,
      sortReverse: filters.sortReverse,
      labelFilters: normalizedLabels(filters.labelFilters),
    };
    try {
      const updated = await call(`view-filters/${encodeURIComponent(viewFilter.name)}`, {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setViewFilters((current) => current.map((filter) => filter.name === updated.name ? updated : filter));
      notice("View filter updated");
    } catch (error) {
      notice(error.message);
    }
  };

  const deleteViewFilter = async (filter) => {
    try {
      await call(`view-filters/${encodeURIComponent(filter.name)}`, { method: "DELETE" });
      setViewFilters((current) => current.filter((item) => item.name !== filter.name));
      if (activeViewFilterName === filter.name) setActiveViewFilterName("");
    } catch (error) {
      notice(error.message);
    }
  };

  const action = async (runAction, message) => {
    try {
      await runAction();
      notice(message);
      load();
    } catch (error) {
      notice(error.message);
    }
  };

  const toggleView = () =>
    action(
      async () => {
        const ids = filters.filtered
          .filter((torrent) =>
            filters.state === "Paused"
              ? torrent.State === "Paused"
              : torrent.State !== "Paused",
          )
          .map((torrent) => "id=" + encodeURIComponent(torrent.Hash))
          .join("&");

        if (ids) {
          await call(
            `torrents/${filters.state === "Paused" ? "resume" : "pause"}?${ids}`,
            { method: "POST" },
          );
        }
      },
      filters.state === "Paused" ? "Torrents resumed" : "Torrents paused",
    );

  return (
    <div className="app">
      <TorrentToolbar
        {...filters}
        toggleView={toggleView}
        openDialog={setDialog}
        viewFilters={viewFilters}
        activeViewFilterName={activeViewFilterName}
        applyViewFilter={applyViewFilter}
        resetView={resetView}
        deleteViewFilter={deleteViewFilter}
        createViewFilter={() => setDialog({ type: "view-filter", settings: {
          state: filters.state, sort: filters.sort, sortReverse: filters.sortReverse,
          labelFilters: filters.labelFilters,
        } })}
        canUpdateViewFilter={hasViewFilterChanges}
        updateActiveViewFilter={updateActiveViewFilter}
      />
      <TorrentListView
        torrents={torrents}
        filtered={filters.filtered}
        search={filters.search}
        openDialog={setDialog}
        action={action}
        load={load}
        notice={notice}
      />
      <StatusBar connected={connected} session={session} disk={disk} />
      {toast && <div className="toast">{toast}</div>}
      {dialog && (
        <Dialog
          d={dialog}
          close={() => setDialog(null)}
          act={action}
          load={load}
          viewFilterCreated={(filter) => {
            setViewFilters((current) => [...current, filter]);
            setActiveViewFilterName(filter.name);
          }}
        />
      )}
    </div>
  );
}

export default App;
