import { useEffect, useRef, useState } from "react";
import { Filter, Plus, RefreshCw, Trash2 } from "lucide-react";

export function ViewFilterMenu({ filters, activeName, onApply, onDelete, onCreate, hasChanges, onUpdate }) {
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
    <div className="view-filter-wrap" ref={root}>
      <button className={'icon-button view-filter-trigger ' + (activeName ? "active" : "")} title="View filters" aria-label="View filters" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Filter size={17} />
      </button>
      {open && <div className="view-filter-menu" role="menu">
        <button className="view-filter-row view-filter-create" role="menuitem" onClick={() => { setOpen(false); onCreate(); }}>
          <Plus size={15} /><span>Create new filter</span>
        </button>
        {activeName && hasChanges && <button className="view-filter-row view-filter-create" role="menuitem" onClick={() => onUpdate()}>
          <RefreshCw size={14} /><span>Save view filter</span>
        </button>}
        {filters.map((filter) => <div className={'view-filter-row ' + (filter.name === activeName ? "active" : "")} key={filter.name}>
          <button className="view-filter-name" role="menuitemradio" aria-checked={filter.name === activeName} onClick={() => onApply(filter)}>
            <span className="view-filter-indicator" aria-hidden="true">{filter.name === activeName ? "●" : "○"}</span>
            <span>{filter.name}</span>
          </button>
          <button className="view-filter-delete" aria-label={`Remove ${filter.name}`} title="Remove filter" onClick={() => onDelete(filter)}><Trash2 size={14} /></button>
        </div>)}
        {!filters.length && <div className="view-filter-empty">No view filters</div>}
      </div>}
    </div>
  );
}
