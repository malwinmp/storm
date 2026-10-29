import { File, Magnet, Wifi } from "lucide-react";
import { call } from "../../api/client.js";
import { size } from "../../utils/formatters.js";
import { Field } from "./Field.jsx";
import { TorrentOptions } from "./TorrentOptions.jsx";

export function DialogContent({
  type,
  dialog,
  entry,
  setEntry,
  config,
  updateConfig,
  removeData,
  setRemoveData,
  checked,
  setChecked,
  label,
  setLabel,
  availableLabels,
  setAvailableLabels,
  query,
  setQuery,
  error,
  act,
  setType,
}) {
  return (
    <div className="modal-body">
      {type === "add-menu" && <AddTorrentChoices setType={setType} />}
      {["magnet", "url"].includes(type) && (
        <AddTorrentSource
          type={type}
          entry={entry}
          setEntry={setEntry}
          config={config}
          updateConfig={updateConfig}
        />
      )}
      {type === "file" && (
        <TorrentFileInput
          setEntry={setEntry}
          config={config}
          updateConfig={updateConfig}
        />
      )}
      {type === "delete" && (
        <DeleteConfirmation
          count={dialog.items.length}
          removeData={removeData}
          setRemoveData={setRemoveData}
        />
      )}
      {type === "files" && (
        <TorrentFileSelection
          torrent={dialog.torrent}
          checked={checked}
          setChecked={setChecked}
        />
      )}
      {type === "label" && (
        <LabelEditor
          dialog={dialog}
          label={label}
          setLabel={setLabel}
          availableLabels={availableLabels}
          setAvailableLabels={setAvailableLabels}
          query={query}
          setQuery={setQuery}
          act={act}
        />
      )}
      {type === "plugin" && (
        <p>
          The Label plugin is required for torrent labels. Enable it in Deluge
          to continue.
        </p>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

function AddTorrentChoices({ setType }) {
  return (
    <div className="add-choices">
      <button onClick={() => setType("magnet")}>
        <Magnet size={19} />
        <span>
          <b>Magnet link</b>
          <small>Paste a magnet URI</small>
        </span>
      </button>
      <button onClick={() => setType("url")}>
        <Wifi size={19} />
        <span>
          <b>Torrent URL</b>
          <small>Download from a web address</small>
        </span>
      </button>
      <button onClick={() => setType("file")}>
        <File size={19} />
        <span>
          <b>Torrent file</b>
          <small>Select a .torrent file</small>
        </span>
      </button>
    </div>
  );
}

function AddTorrentSource({ type, entry, setEntry, config, updateConfig }) {
  return (
    <>
      <Field label={type === "magnet" ? "Magnet URI" : "Torrent URL"}>
        <input
          autoFocus
          placeholder={
            type === "magnet"
              ? "magnet:?xt=urn:btih:…"
              : "https://example.com/file.torrent"
          }
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
        />
      </Field>
      <TorrentOptions config={config} updateConfig={updateConfig} />
    </>
  );
}

function TorrentFileInput({ setEntry, config, updateConfig }) {
  return (
    <>
      <Field label="Torrent file">
        <input
          type="file"
          accept=".torrent,application/x-bittorrent"
          onChange={(event) => setEntry(event.target.files?.[0] || "")}
        />
      </Field>
      <TorrentOptions config={config} updateConfig={updateConfig} />
    </>
  );
}

function DeleteConfirmation({ count, removeData, setRemoveData }) {
  return (
    <div className="delete-confirm">
      <p>
        Remove {count} {count === 1 ? "torrent" : "torrents"} from Deluge?
      </p>
      <label className="check-field">
        <input
          type="checkbox"
          checked={removeData}
          onChange={(event) => setRemoveData(event.target.checked)}
        />
        Also delete downloaded files
      </label>
    </div>
  );
}

function TorrentFileSelection({ torrent, checked, setChecked }) {
  return (
    <div className="file-list">
      {(torrent.Files || []).map((file, index) => (
        <label key={index} className="file-row">
          <input
            type="checkbox"
            checked={!!checked[index]}
            onChange={(event) =>
              setChecked((current) =>
                current.map((value, currentIndex) =>
                  index === currentIndex ? event.target.checked : value,
                ),
              )
            }
          />
          <span>{file.Path}</span>
          <small>{size(file.Size)}</small>
        </label>
      ))}
    </div>
  );
}

function LabelEditor({
  dialog,
  label,
  setLabel,
  availableLabels,
  setAvailableLabels,
  query,
  setQuery,
  act,
  setType,
}) {
  return (
    <>
      <Field label="Label">
        <input
          autoFocus
          placeholder="Type a label or create one"
          value={label}
          onChange={(event) => {
            setLabel(event.target.value);
            setQuery(event.target.value.toLowerCase());
          }}
          list="label-options"
        />
        <datalist id="label-options">
          {availableLabels
            .filter((option) => option.toLowerCase().includes(query))
            .map((option) => (
              <option key={option} value={option} />
            ))}
        </datalist>
      </Field>
      <div className="label-suggestions">
        {availableLabels
          .filter(
            (option) =>
              option.toLowerCase().includes(query) && option !== dialog.current,
          )
          .map((option) => (
            <button key={option} onClick={() => setLabel(option)}>
              {option}
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  act(
                    () =>
                      call("labels/" + encodeURIComponent(option), {
                        method: "DELETE",
                      }),
                    "Label deleted",
                  ).then(() =>
                    setAvailableLabels((current) =>
                      current.filter((existing) => existing !== option),
                    ),
                  );
                }}
              >
                ×
              </span>
            </button>
          ))}
      </div>
      {dialog.current && (
        <button className="text-button" onClick={() => setLabel("")}>
          Clear current label
        </button>
      )}
    </>
  );
}
