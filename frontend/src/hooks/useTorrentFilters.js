import { useMemo, useState } from "react";

export function useTorrentFilters(torrents) {
  const [state, setState] = useState("All");
  const [labelFilters, setLabelFilters] = useState({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("TimeAdded");
  const [reverse, setReverse] = useState(true);

  const labelOptions = useMemo(() => {
    const unique = [
      ...new Set(
        (torrents || []).map((torrent) => torrent.Label || "").filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));

    if ((torrents || []).some((torrent) => !torrent.Label)) {
      unique.push("Untagged");
    }
    return unique;
  }, [torrents]);

  const filtered = useMemo(() => {
    const included = Object.keys(labelFilters).filter(
      (label) => labelFilters[label] === 1,
    );
    const excluded = Object.keys(labelFilters).filter(
      (label) => labelFilters[label] === -1,
    );

    const visibleTorrents = (torrents || []).filter((torrent) => {
      const label = torrent.Label || "Untagged";
      const matchesState =
        state === "All" ||
        (state === "Active"
          ? Number(torrent.DownloadPayloadRate) > 0 ||
            Number(torrent.UploadPayloadRate) > 0
          : torrent.State === state);
      const matchesLabels =
        (included.length === 0 || included.includes(label)) &&
        !excluded.includes(label);
      const matchesSearch =
        torrent.Name.toLowerCase().includes(search.toLowerCase()) ||
        torrent.Hash.toLowerCase().includes(search.toLowerCase());

      return matchesState && matchesLabels && matchesSearch;
    });

    visibleTorrents.sort((left, right) => {
      const leftValue = left[sort];
      const rightValue = right[sort];
      const comparison =
        typeof leftValue === "string"
          ? String(leftValue).localeCompare(String(rightValue))
          : (leftValue || 0) - (rightValue || 0);
      return reverse ? -comparison : comparison;
    });

    return visibleTorrents;
  }, [torrents, search, sort, reverse, state, labelFilters]);

  return {
    state,
    setState,
    labelFilters,
    setLabelFilters,
    search,
    setSearch,
    sort,
    setSort,
    reverse,
    setReverse,
    labelOptions,
    filtered,
  };
}
