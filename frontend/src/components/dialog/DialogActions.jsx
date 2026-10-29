import { call } from "../../api/client.js";

export function DialogActions({
  type,
  dialog,
  entry,
  config,
  busy,
  run,
  close,
  checked,
  removeData,
  label,
}) {
  return (
    <div className="modal-footer">
      <button className="secondary" onClick={close}>
        Cancel
      </button>
      {type === "magnet" && (
        <button
          className="primary"
          disabled={busy || !entry.trim()}
          onClick={() =>
            run(() =>
              call("torrents", {
                method: "POST",
                body: JSON.stringify({
                  Type: "magnet",
                  URI: entry,
                  Options: config,
                }),
              }),
            )
          }
        >
          {busy ? "Adding…" : "Add magnet"}
        </button>
      )}
      {type === "url" && (
        <button
          className="primary"
          disabled={busy || !entry.trim()}
          onClick={() =>
            run(() =>
              call("torrents", {
                method: "POST",
                body: JSON.stringify({
                  Type: "url",
                  URI: entry,
                  Options: config,
                }),
              }),
            )
          }
        >
          {busy ? "Adding…" : "Add torrent"}
        </button>
      )}
      {type === "file" && (
        <button
          className="primary"
          disabled={busy || !entry}
          onClick={() =>
            run(async () => {
              const bytes = new Uint8Array(await entry.arrayBuffer());
              let binary = "";
              for (let index = 0; index < bytes.length; index += 0x8000) {
                binary += String.fromCharCode(
                  ...bytes.subarray(index, index + 0x8000),
                );
              }
              const data = btoa(binary);
              await call("torrents", {
                method: "POST",
                body: JSON.stringify({
                  Type: "file",
                  URI: entry.name,
                  Data: data,
                  Options: config,
                }),
              });
            })
          }
        >
          {busy ? "Adding…" : "Add file"}
        </button>
      )}
      {type === "delete" && (
        <button
          className="primary danger-fill"
          disabled={busy}
          onClick={() =>
            run(async () => {
              for (const id of dialog.items) {
                await call(`torrent/${id}?files=${removeData}`, {
                  method: "DELETE",
                });
              }
            })
          }
        >
          {busy ? "Removing…" : "Remove torrent"}
        </button>
      )}
      {type === "files" && (
        <button
          className="primary"
          disabled={busy}
          onClick={() =>
            run(() =>
              call(`torrent/${dialog.torrent.Hash}`, {
                method: "PUT",
                body: JSON.stringify({
                  FilePriorities: checked.map((selected) => (selected ? 4 : 0)),
                }),
              }),
            )
          }
        >
          Apply selection
        </button>
      )}
      {type === "label" && (
        <button
          className="primary"
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (label && !dialog.labels.includes(label)) {
                await call("labels/" + encodeURIComponent(label), {
                  method: "POST",
                });
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
              await call(`torrent/${dialog.id}/label`, {
                method: "POST",
                body: JSON.stringify({ Label: label }),
              });
            })
          }
        >
          Save label
        </button>
      )}
      {type === "plugin" && (
        <button
          className="primary"
          onClick={() => run(() => call("plugins/Label", { method: "POST" }))}
        >
          Enable plugin
        </button>
      )}
    </div>
  );
}
