import { Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";

export function GlobalTorrentActions({
  state,
  filtered,
  labelFilters,
  setLabelFilters,
  toggleView,
  openDialog,
}) {
  return (
    <div className="global-actions">
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
      <button
        className="icon-button"
        title="Reset label filters"
        aria-label="Reset label filters"
        onClick={() => setLabelFilters({})}
        disabled={!Object.values(labelFilters).some(Boolean)}
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}
