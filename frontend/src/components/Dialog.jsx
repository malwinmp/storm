import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { call } from "../api/client.js";
import { DialogActions } from "./dialog/DialogActions.jsx";
import { DialogContent } from "./dialog/DialogContent.jsx";

function Dialog({ d, close, act, load }) {
  const [type, setType] = useState(d.type);
  const [entry, setEntry] = useState("");
  const [config, setConfig] = useState(d.config || {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState([]);
  const [label, setLabel] = useState(d.current || "");
  const [availableLabels, setAvailableLabels] = useState(d.labels || []);
  const [query, setQuery] = useState("");
  const [removeData, setRemoveData] = useState(true);

  useEffect(() => {
    if (d.type === "files") {
      setChecked(
        (d.torrent.Files || []).map(
          (_, index) => (d.torrent.FilePriorities?.[index] ?? 4) !== 0,
        ),
      );
    }
  }, [d]);

  const updateConfig = (key, value) =>
    setConfig((current) => ({ ...current, [key]: value }));

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      close();
      load();
    } catch (actionError) {
      setError(actionError.message);
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section className="modal">
        <DialogHeader type={type} close={close} />
        <DialogContent
          type={type}
          dialog={d}
          entry={entry}
          setEntry={setEntry}
          config={config}
          updateConfig={updateConfig}
          removeData={removeData}
          setRemoveData={setRemoveData}
          checked={checked}
          setChecked={setChecked}
          label={label}
          setLabel={setLabel}
          availableLabels={availableLabels}
          setAvailableLabels={setAvailableLabels}
          query={query}
          setQuery={setQuery}
          error={error}
          act={act}
          setType={setType}
        />
        <DialogActions
          type={type}
          dialog={d}
          entry={entry}
          config={config}
          busy={busy}
          run={run}
          close={close}
          checked={checked}
          removeData={removeData}
          label={label}
        />
      </section>
    </div>
  );
}

function DialogHeader({ type, close }) {
  const title = getDialogTitle(type);
  const description = getDialogDescription(type);

  return (
    <div className="modal-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button className="close-button" onClick={close}>
        <X size={18} />
      </button>
    </div>
  );
}

function getDialogTitle(type) {
  const titles = {
    "add-menu": "Add torrent",
    magnet: "Add magnet link",
    url: "Add from URL",
    file: "Add torrent file",
    delete: "Remove torrent",
    files: "Select files",
    label: "Edit label",
    plugin: "Enable Label plugin",
  };
  return titles[type] || "";
}

function getDialogDescription(type) {
  const descriptions = {
    delete: "Choose whether to remove downloaded data as well.",
    files: "Choose which files to download.",
    label: "Assign or create a label.",
  };
  return descriptions[type] || "Configure the torrent before adding it.";
}

export default Dialog;
