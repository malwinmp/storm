import { Pause, Play, Plus, Trash2 } from "lucide-react";
import { ViewFilterMenu } from "./ViewFilterMenu.jsx";

export function GlobalTorrentActions({
  state,
  filtered,
  toggleView,
  openDialog,
  viewFilters,
  activeViewFilterName,
  applyViewFilter,
  deleteViewFilter,
  createViewFilter,
  hasActiveViewFilterChanges,
  updateActiveViewFilter,
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
      <ViewFilterMenu filters={viewFilters} activeName={activeViewFilterName} onApply={applyViewFilter} onDelete={deleteViewFilter} onCreate={createViewFilter} hasChanges={hasActiveViewFilterChanges} onUpdate={updateActiveViewFilter} />
      </>}
    </div>
  );
}
