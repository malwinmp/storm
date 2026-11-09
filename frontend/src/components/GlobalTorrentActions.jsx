import { Pause, Play, Plus, Trash2 } from "lucide-react";
import { SavedFilterMenu } from "./SavedFilterMenu.jsx";

export function GlobalTorrentActions({
  state,
  filtered,
  toggleView,
  openDialog,
  savedFilters,
  activeFilterId,
  applySavedFilter,
  deleteSavedFilter,
  createSavedFilter,
  hasActiveFilterChanges,
  updateActiveFilter,
  variant = "actions",
}) {
  return (
    <div className={`global-actions global-actions-${variant}`}>
      {variant === "actions" && <>
      <button
        className="icon-button add-button"
        title="Add torrent"
        onClick={() => openDialog({ type: "add-menu" })}
      >
        <Plus size={19} />
      </button>
      <button
        className="icon-button"
        title={state === "Paused" ? "Resume displayed" : "Pause displayed"}
        onClick={toggleView}
        disabled={!filtered.length}
      >
        {state === "Paused" ? <Play size={17} /> : <Pause size={17} />}
      </button>
      </>}
      {variant === "utilities" && <>
      <button
        className="icon-button danger"
        title="Remove displayed"
        onClick={() =>
          filtered.length &&
          openDialog({
            type: "delete",
            items: filtered.map((torrent) => torrent.Hash),
          })
        }
        disabled={!filtered.length}
      >
        <Trash2 size={17} />
      </button>
      <SavedFilterMenu filters={savedFilters} activeId={activeFilterId} onApply={applySavedFilter} onDelete={deleteSavedFilter} onCreate={createSavedFilter} hasChanges={hasActiveFilterChanges} onUpdate={updateActiveFilter} />
      </>}
    </div>
  );
}
