import { useCallback, useEffect, useState } from "react";
import { call } from "../api/client.js";
import { TORRENT_REFRESH_INTERVAL_MS } from "../utils/formatters.js";

export function useTorrentData(notice) {
  const [torrents, setTorrents] = useState(null);
  const [session, setSession] = useState({});
  const [disk, setDisk] = useState(0);
  const [connected, setConnected] = useState(true);

  const load = useCallback(async () => {
    try {
      const plugins = await call("plugins");
      if (!plugins.includes("Label")) {
        await call("plugins/Label", { method: "POST" });
        notice("Label plugin enabled");
      }

      const view = await call("view");
      if (view) {
        setTorrents(view.Torrents || []);
        setSession(view.Session || {});
        setDisk(view.DiskFree || 0);
      }
      setConnected(true);
    } catch (error) {
      setConnected(false);
      console.error(error);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, TORRENT_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () =>
      document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [load]);

  return { torrents, session, disk, connected, load };
}
