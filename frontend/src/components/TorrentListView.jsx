import { CloudMoon, Plus, RefreshCw } from "lucide-react";
import { TorrentCard } from "./TorrentCard.jsx";

export function TorrentListView({
  torrents,
  filtered,
  search,
  openDialog,
  action,
  load,
  notice,
}) {
  return (
    <main className="main flex-1">
      {torrents === null ? (
        <div className="empty">
          <RefreshCw className="spin" size={30} />
          <span>Connecting to Deluge…</span>
        </div>
      ) : !filtered.length ? (
        <EmptyTorrentList search={search} openDialog={openDialog} />
      ) : (
        <div className="torrent-list flex flex-col">
          {filtered.map((torrent) => (
            <TorrentCard
              key={torrent.Hash}
              t={torrent}
              open={openDialog}
              act={action}
              reload={load}
              notice={notice}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyTorrentList({ search, openDialog }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <CloudMoon size={27} />
      </div>
      <strong>{search ? "No matching torrents" : "No torrents here"}</strong>
      <span>
        {search ? "Try a different search." : "Add a torrent to get started."}
      </span>
      {!search && (
        <button
          className="primary"
          onClick={() => openDialog({ type: "add-menu" })}
        >
          <Plus size={16} /> Add torrent
        </button>
      )}
    </div>
  );
}
