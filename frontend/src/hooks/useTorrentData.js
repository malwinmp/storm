import { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../api/client.js";
import { TORRENT_REFRESH_INTERVAL_MS } from "../utils/formatters.js";

const DISK_REFRESH_INTERVAL_MS = 60_000;

export function useTorrentData(notice) {
  const [torrents, setTorrents] = useState(null);
  const [session, setSession] = useState({});
  const [disk, setDisk] = useState(0);
  const [connected, setConnected] = useState(true);
  const lastDiskRefresh = useRef(0);
  const diskRefreshInFlight = useRef(false);
  const labelPluginChecked = useRef(false);

  const load = useCallback(async () => {
    try {
      if (!labelPluginChecked.current) {
        const plugins = await call("plugins");
        if (!plugins.includes("Label")) {
          await call("plugins/Label", { method: "POST" });
          notice("Label plugin enabled");
        }
        labelPluginChecked.current = true;
      }

      const view = await call("view");
      if (view) {
        setTorrents(view.Torrents || []);
        setSession(view.Session || {});
        if (
          !diskRefreshInFlight.current &&
          Date.now() - lastDiskRefresh.current >= DISK_REFRESH_INTERVAL_MS
        ) {
          diskRefreshInFlight.current = true;
          try {
            const diskStatus = await call("disk/free");
            setDisk(diskStatus?.FreeBytes || 0);
            lastDiskRefresh.current = Date.now();
          } catch (error) {
            console.error(error);
          } finally {
            diskRefreshInFlight.current = false;
          }
        }
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
