import { useEffect, useRef, useState } from "react";
import { Filter, Plus, RefreshCw, Trash2 } from "lucide-react";

export function SavedFilterMenu({ filters, activeId, onApply, onDelete, onCreate, hasChanges, onUpdate }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    const close = (event) => {
      if (root.current && !root.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="saved-filter-wrap" ref={root}>
      <button className={'icon-button saved-filter-trigger ' + (activeId ? "active" : "")} title="Saved filters" aria-label="Saved filters" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Filter size={17} />
      </button>
      {open && <div className="saved-filter-menu" role="menu">
        <button className="saved-filter-row saved-filter-create" role="menuitem" onClick={() => { setOpen(false); onCreate(); }}>
          <Plus size={15} /><span>Create new filter</span>
        </button>
        {activeId && hasChanges && <button className="saved-filter-row saved-filter-create" role="menuitem" onClick={() => onUpdate()}>
          <RefreshCw size={14} /><span>Save filter</span>
        </button>}
        {filters.map((filter) => <div className={'saved-filter-row ' + (filter.id === activeId ? "active" : "")} key={filter.id}>
          <button className="saved-filter-name" role="menuitemradio" aria-checked={filter.id === activeId} onClick={() => onApply(filter)}>
            <span className="saved-filter-indicator" aria-hidden="true">{filter.id === activeId ? "●" : "○"}</span>
            <span>{filter.name}</span>
          </button>
          <button className="saved-filter-delete" aria-label={`Remove ${filter.name}`} title="Remove filter" onClick={() => onDelete(filter)}><Trash2 size={14} /></button>
        </div>)}
        {!filters.length && <div className="saved-filter-empty">No saved filters</div>}
      </div>}
    </div>
  );
}
