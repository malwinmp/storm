import { useEffect, useId, useRef, useState } from "react";

export function TrackerStatusMarker({ status }) {
  const [open, setOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const rootRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideTap = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideTap);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideTap);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const toggleTooltip = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const marker = rootRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(280, window.innerWidth - 24);
    const centeredLeft = marker.left + marker.width / 2 - tooltipWidth / 2;
    const left = Math.max(
      12,
      Math.min(centeredLeft, window.innerWidth - tooltipWidth - 12),
    );
    const placeBelow = marker.top < 110;

    setTooltipPosition({
      left,
      top: placeBelow ? marker.bottom + 8 : marker.top - 8,
      transform: placeBelow ? "none" : "translateY(-100%)",
    });
    setOpen(true);
  };

  return (
    <span className="tracker-status-marker" ref={rootRef}>
      <button
        type="button"
        className="unregistered-marker"
        title={status}
        aria-label={`Unregistered tracker status: ${status}`}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={toggleTooltip}
      >
        (U)
      </button>
      {open && (
        <span
          className="tracker-status-tooltip"
          id={tooltipId}
          role="tooltip"
          style={tooltipPosition}
        >
          {status}
        </span>
      )}
    </span>
  );
}
