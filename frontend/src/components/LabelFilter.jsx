import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Tag } from "lucide-react";

export function LabelFilter({ labelOptions, labelFilters, setLabelFilters }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const closeWhenOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  const hasFilters = Object.values(labelFilters).some(
    (status) => status === 1 || status === -1,
  );

  const cycleFilter = (label) => {
    setLabelFilters((current) => ({
      ...current,
      [label]:
        current[label] === 0 || !current[label]
          ? 1
          : current[label] === 1
            ? -1
            : 0,
    }));
  };

  return (
    <div className="select-wrap label-filter-wrap" ref={rootRef}>
      <Tag size={15} />
      <button
        className="label-filter-trigger"
        aria-expanded={open}
        aria-label="Filter by label"
        onClick={() => setOpen(!open)}
      >
        Labels
        {hasFilters && <span className="dropdown-count">(A)</span>}
      </button>
      {open && (
        <div
          className="label-filter-menu"
          role="group"
          aria-label="Filter by label"
        >
          {labelOptions.length ? (
            labelOptions.map((label) => (
              <LabelFilterOption
                key={label}
                label={label}
                status={labelFilters[label] || 0}
                onClick={() => cycleFilter(label)}
              />
            ))
          ) : (
            <span className="label-filter-empty">No labels</span>
          )}
        </div>
      )}
    </div>
  );
}

function LabelFilterOption({ label, status, onClick }) {
  const className = status === 1 ? "included" : status === -1 ? "excluded" : "";
  const checked = status === 0 ? "false" : status === 1 ? "true" : "mixed";
  const description =
    status === 1 ? "included" : status === -1 ? "excluded" : "not filtered";
  const title =
    status === 1 ? "Included" : status === -1 ? "Excluded" : "Not filtered";

  return (
    <button
      className={`label-filter-option ${className}`}
      role="checkbox"
      aria-checked={checked}
      aria-label={`${label}: ${description}`}
      title={title}
      onClick={onClick}
    >
      <span className="label-check">
        {status === 1 ? (
          <Plus size={13} />
        ) : status === -1 ? (
          <Minus size={13} />
        ) : null}
      </span>
      <span>{label}</span>
    </button>
  );
}
