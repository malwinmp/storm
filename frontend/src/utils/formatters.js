export const TORRENT_REFRESH_INTERVAL_MS = 1000;

export const size = (n) => {
  if (!n) return "0 B";
  let u = ["B", "KB", "MB", "GB", "TB"],
    i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), 4);
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
};

export const duration = (s) => {
  if (!s) return "∞";
  let d = Math.floor(s / 86400),
    h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : `${h ? `${h}h ` : ""}${m}m`;
};

export const announceTime = (s) => {
  let n = Number(s);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n === 0) return "now";
  let t = Math.ceil(n),
    d = Math.floor(t / 86400),
    h = Math.floor((t % 86400) / 3600),
    m = Math.floor((t % 3600) / 60),
    sec = t % 60;
  return d
    ? d + "d " + h + "h"
    : h
      ? h + "h " + m + "m"
      : m
        ? m + "m " + sec + "s"
        : sec + "s";
};

export const addedAgo = (timestamp) => {
  let date = Number(timestamp) * 1000;
  if (!Number.isFinite(date) || date <= 0) return "Unknown";
  let hours = Math.floor((Date.now() - date) / 3600000);
  if (hours < 0) return "just now";
  let days = Math.floor(hours / 24),
    remaining = hours % 24;
  return days
    ? days + "d " + remaining + "h ago"
    : hours === 0
      ? "<1h ago"
      : hours + "h ago";
};

export const states = [
  "All",
  "Active",
  "Queued",
  "Downloading",
  "Seeding",
  "Paused",
  "Error",
];

export const sorts = {
  TimeAdded: "Added",
  State: "State",
  Progress: "Progress",
  ETA: "ETA",
  Name: "Name",
  TotalSize: "Size",
  Ratio: "Ratio",
  SeedingTime: "Seeding",
};

export const pretty = (s) =>
  s === "Downloading"
    ? "downloading"
    : s === "Seeding"
      ? "seeding"
      : s === "Paused"
        ? "paused"
        : s === "Error"
          ? "error"
          : s === "Queued"
            ? "queued"
            : s === "Allocating"
              ? "allocating"
              : s === "Checking"
                ? "checking"
                : s === "Moving"
                  ? "moving"
                  : "active";
