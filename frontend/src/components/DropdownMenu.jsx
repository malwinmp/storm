import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

export function DropdownMenu({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  after,
  className = "",
  count,
}) {
  const [open, setOpen] = useState(false),
    [menuStyle, setMenuStyle] = useState(null),
    ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  let selected = options.find((option) => option.value === value);
  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (className === "filter-wrap") {
      let rect = ref.current.getBoundingClientRect(),
        width = Math.min(
          Math.max(rect.width, 190),
          window.innerWidth - rect.left - 12,
        );
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        right: "auto",
        top: rect.bottom + 6,
        width,
        maxWidth: window.innerWidth - rect.left - 12,
      });
    } else setMenuStyle(null);
    setOpen(true);
  };
  return (
    <div ref={ref} className={"select-wrap dropdown-wrap " + className}>
      <Icon size={15} />
      <button
        type="button"
        className="dropdown-trigger"
        aria-label={label}
        aria-expanded={open}
        onClick={toggle}
      >
        {selected?.label || label}
        {count !== undefined && (
          <span className="dropdown-count">({count})</span>
        )}
      </button>
      {after}
      {open && (
        <div
          className="dropdown-menu"
          style={
            menuStyle ||
            (className === "sort-wrap"
              ? {
                  left: 0,
                  right: "auto",
                }
              : undefined)
          }
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={
                "dropdown-option " + (option.value === value ? "selected" : "")
              }
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              {option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;
