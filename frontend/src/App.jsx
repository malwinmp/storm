import { useCallback, useEffect, useState } from "react";
import { call } from "./api/client.js";
import Dialog from "./components/Dialog.jsx";
import { StatusBar } from "./components/StatusBar.jsx";
import { TorrentListView } from "./components/TorrentListView.jsx";
import { TorrentToolbar } from "./components/TorrentToolbar.jsx";
import { useTorrentData } from "./hooks/useTorrentData.js";
import { useTorrentFilters } from "./hooks/useTorrentFilters.js";

export function App() {
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");
  const [savedFilters, setSavedFilters] = useState([]);
  const [activeFilterId, setActiveFilterId] = useState("");

  const notice = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const { torrents, session, disk, connected, load } = useTorrentData(notice);
  const filters = useTorrentFilters(torrents);

  const loadSavedFilters = useCallback(async () => {
    try {
      setSavedFilters((await call("filters")) || []);
    } catch (error) {
      notice(error.message);
    }
  }, [notice]);

  useEffect(() => { loadSavedFilters(); }, [loadSavedFilters]);

  const applySavedFilter = (filter) => {
    if (activeFilterId === filter.id) {
      setActiveFilterId("");
      filters.setState("All");
      filters.setSort("TimeAdded");
      filters.setReverse(true);
      filters.setLabelFilters({});
      return;
    }
    setActiveFilterId(filter.id);
    filters.setState(filter.state);
    filters.setSort(filter.sort);
    filters.setReverse(filter.reverse);
    filters.setLabelFilters(filter.labelFilters || {});
  };

  const activeSavedFilter = savedFilters.find((filter) => filter.id === activeFilterId);
  const normalizedLabels = (labels = {}) => Object.fromEntries(
    Object.entries(labels).filter(([, value]) => value === 1 || value === -1).sort(([a], [b]) => a.localeCompare(b)),
  );
  const hasActiveFilterChanges = !!activeSavedFilter && JSON.stringify({
    state: activeSavedFilter.state,
    sort: activeSavedFilter.sort,
    reverse: activeSavedFilter.reverse,
    labelFilters: normalizedLabels(activeSavedFilter.labelFilters),
  }) !== JSON.stringify({
    state: filters.state,
    sort: filters.sort,
    reverse: filters.reverse,
    labelFilters: normalizedLabels(filters.labelFilters),
  });

  const updateActiveFilter = async () => {
    if (!activeSavedFilter || !hasActiveFilterChanges) return;
    const settings = {
      state: filters.state,
      sort: filters.sort,
      reverse: filters.reverse,
      labelFilters: normalizedLabels(filters.labelFilters),
    };
    try {
      const updated = await call(`filters/${encodeURIComponent(activeSavedFilter.id)}`, {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSavedFilters((current) => current.map((filter) => filter.id === updated.id ? updated : filter));
      notice("Saved filter updated");
    } catch (error) {
      notice(error.message);
    }
  };

  const deleteSavedFilter = async (filter) => {
    try {
      await call(`filters/${encodeURIComponent(filter.id)}`, { method: "DELETE" });
      setSavedFilters((current) => current.filter((item) => item.id !== filter.id));
      if (activeFilterId === filter.id) setActiveFilterId("");
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
    <div className="app min-h-screen flex flex-col">
      <TorrentToolbar
        {...filters}
        toggleView={toggleView}
        openDialog={setDialog}
        savedFilters={savedFilters}
        activeFilterId={activeFilterId}
        applySavedFilter={applySavedFilter}
        deleteSavedFilter={deleteSavedFilter}
        createSavedFilter={() => setDialog({ type: "saved-filter", settings: {
          state: filters.state, sort: filters.sort, reverse: filters.reverse,
          labelFilters: filters.labelFilters,
        } })}
        hasActiveFilterChanges={hasActiveFilterChanges}
        updateActiveFilter={updateActiveFilter}
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
          savedFilterCreated={(filter) => {
            setSavedFilters((current) => [...current, filter]);
            setActiveFilterId(filter.id);
          }}
        />
      )}
    </div>
  );
}

export default App;
