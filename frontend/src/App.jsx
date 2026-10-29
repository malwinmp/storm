import { useCallback, useState } from "react";
import { call } from "./api/client.js";
import Dialog from "./components/Dialog.jsx";
import { StatusBar } from "./components/StatusBar.jsx";
import { TorrentListView } from "./components/TorrentListView.jsx";
import { TorrentToolbar } from "./components/TorrentToolbar.jsx";
import { useTorrentData } from "./hooks/useTorrentData.js";
import { useTorrentFilters } from "./hooks/useTorrentFilters.js";

export function App() {
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");

  const notice = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const { torrents, session, disk, connected, load } = useTorrentData(notice);
  const filters = useTorrentFilters(torrents);

  const action = async (runAction, message) => {
    try {
      await runAction();
      notice(message);
      load();
    } catch (error) {
      notice(error.message);
    }
  };

  const toggleView = () =>
    action(
      async () => {
        const ids = filters.filtered
          .filter((torrent) =>
            filters.state === "Paused"
              ? torrent.State === "Paused"
              : torrent.State !== "Paused",
          )
          .map((torrent) => "id=" + encodeURIComponent(torrent.Hash))
          .join("&");

        if (ids) {
          await call(
            `torrents/${filters.state === "Paused" ? "resume" : "pause"}?${ids}`,
            { method: "POST" },
          );
        }
      },
      filters.state === "Paused" ? "Torrents resumed" : "Torrents paused",
    );

  return (
    <div className="app min-h-screen flex flex-col">
      <TorrentToolbar
        {...filters}
        toggleView={toggleView}
        openDialog={setDialog}
      />
      <TorrentListView
        torrents={torrents}
        filtered={filters.filtered}
        search={filters.search}
        openDialog={setDialog}
        action={action}
        load={load}
        notice={notice}
      />
      <StatusBar connected={connected} session={session} disk={disk} />
      {toast && <div className="toast">{toast}</div>}
      {dialog && (
        <Dialog
          d={dialog}
          close={() => setDialog(null)}
          act={action}
          load={load}
        />
      )}
    </div>
  );
}

export default App;
