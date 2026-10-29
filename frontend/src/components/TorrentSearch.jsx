import { Search, X } from "lucide-react";

export function TorrentSearch({ search, setSearch }) {
  return (
    <div className="searchbox">
      <Search size={15} />
      <input
        placeholder="Search torrents…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {search && (
        <button onClick={() => setSearch("")}>
          <X size={14} />
        </button>
      )}
      <kbd>⌘ K</kbd>
    </div>
  );
}
