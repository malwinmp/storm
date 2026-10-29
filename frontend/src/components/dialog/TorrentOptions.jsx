import { Settings } from "lucide-react";
import { Field } from "./Field.jsx";

export function TorrentOptions({ config, updateConfig }) {
  return (
    <details className="options">
      <summary>
        <Settings size={15} /> Torrent options
      </summary>
      <div className="option-grid">
        <Field label="Max download speed (KB/s)">
          <input
            type="number"
            value={config.MaxDownloadSpeed ?? -1}
            onChange={(event) =>
              updateConfig("MaxDownloadSpeed", +event.target.value)
            }
          />
        </Field>
        <Field label="Max upload speed (KB/s)">
          <input
            type="number"
            value={config.MaxUploadSpeed ?? -1}
            onChange={(event) =>
              updateConfig("MaxUploadSpeed", +event.target.value)
            }
          />
        </Field>
        <Field label="Max connections">
          <input
            type="number"
            value={config.MaxConnections ?? ""}
            onChange={(event) =>
              updateConfig("MaxConnections", +event.target.value)
            }
          />
        </Field>
        <Field label="Max upload slots">
          <input
            type="number"
            value={config.MaxUploadSlots ?? ""}
            onChange={(event) =>
              updateConfig("MaxUploadSlots", +event.target.value)
            }
          />
        </Field>
        <Field label="Download location" wide>
          <input
            value={config.DownloadLocation || ""}
            onChange={(event) =>
              updateConfig("DownloadLocation", event.target.value)
            }
          />
        </Field>
        <ConfigCheckbox
          checked={!!config.AddPaused}
          onChange={(checked) => updateConfig("AddPaused", checked)}
        >
          Add paused
        </ConfigCheckbox>
        <ConfigCheckbox
          checked={!!config.PrioritizeFirstLastPieces}
          onChange={(checked) =>
            updateConfig("PrioritizeFirstLastPieces", checked)
          }
        >
          Prioritise first and last pieces
        </ConfigCheckbox>
        <ConfigCheckbox
          checked={!!config.PreAllocateStorage}
          onChange={(checked) => updateConfig("PreAllocateStorage", checked)}
        >
          Pre-allocate storage
        </ConfigCheckbox>
        <ConfigCheckbox
          checked={!!config.StopAtRatio}
          onChange={(checked) => {
            updateConfig("StopAtRatio", checked);
            if (!checked) {
              updateConfig("StopRatio", null);
              updateConfig("RemoveAtRatio", null);
            }
          }}
        >
          Stop at ratio
        </ConfigCheckbox>
        {config.StopAtRatio && (
          <>
            <Field label="Stop ratio">
              <input
                type="number"
                value={config.StopRatio ?? ""}
                onChange={(event) =>
                  updateConfig("StopRatio", +event.target.value)
                }
              />
            </Field>
            <Field label="Remove at ratio">
              <input
                type="number"
                value={config.RemoveAtRatio ?? ""}
                onChange={(event) =>
                  updateConfig("RemoveAtRatio", +event.target.value)
                }
              />
            </Field>
          </>
        )}
        <ConfigCheckbox
          checked={!!config.MoveCompleted}
          onChange={(checked) => {
            updateConfig("MoveCompleted", checked);
            if (!checked) updateConfig("MoveCompletedPath", null);
          }}
        >
          Move completed
        </ConfigCheckbox>
        {config.MoveCompleted && (
          <Field label="Move completed path" wide>
            <input
              value={config.MoveCompletedPath || ""}
              onChange={(event) =>
                updateConfig("MoveCompletedPath", event.target.value)
              }
            />
          </Field>
        )}
      </div>
    </details>
  );
}

function ConfigCheckbox({ checked, onChange, children }) {
  return (
    <label className="check-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />{" "}
      {children}
    </label>
  );
}
