import { useEffect, useRef, useState } from "react";
import { Filter, MoreVertical, Plus, RefreshCw, Trash2 } from "lucide-react";

export function ViewFilterMenu({ filters, activeName, onApply, onDelete, onCreate, canUpdate, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [actionsFor, setActionsFor] = useState("");
  const root = useRef(null);
  useEffect(() => {
    const close = (event) => {
      if (root.current && !root.current.contains(event.target)) {
        setOpen(false);
        setActionsFor("");
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="view-filter-wrap" ref={root}>
      <button className="icon-button view-filter-trigger" title="View filters" aria-label="View filters" aria-expanded={open} onClick={() => { setOpen((value) => !value); setActionsFor(""); }}>
        <Filter size={17} />
      </button>
      {open && <div className="view-filter-menu" role="menu">
        <button className="view-filter-row view-filter-create" role="menuitem" onClick={() => { setOpen(false); onCreate(); }}>
          <Plus size={15} /><span>Create new filter</span>
        </button>
        {filters.map((filter) => <div className={'view-filter-row ' + (filter.name === activeName ? "active" : "")} key={filter.name}>
          <button className="view-filter-name" role="menuitemradio" aria-checked={filter.name === activeName} onClick={() => onApply(filter)}>
            <span>{filter.name}</span>
          </button>
          <div className="view-filter-actions">
            <button className="view-filter-actions-trigger" aria-label={`Actions for ${filter.name}`} title="Filter actions" aria-expanded={actionsFor === filter.name} onClick={() => setActionsFor((current) => current === filter.name ? "" : filter.name)}>
              <MoreVertical size={16} />
            </button>
            {actionsFor === filter.name && <div className="view-filter-actions-menu" role="menu">
              <button role="menuitem" disabled={!canUpdate(filter)} onClick={() => { setActionsFor(""); onUpdate(filter); }}><RefreshCw size={13} /><span>Update</span></button>
              <button role="menuitem" onClick={() => { setActionsFor(""); onDelete(filter); }}><Trash2 size={13} /><span>Delete</span></button>
            </div>}
          </div>
        </div>)}
        {!filters.length && <div className="view-filter-empty">No view filters</div>}
      </div>}
    </div>
  );
}
