import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  FolderOpen,
  HardDrive,
  Pause,
  Play,
  Radio,
  Tag,
  Trash2,
} from "lucide-react";
import { call } from "../api/client.js";
import {
  addedAgo,
  announceTime,
  duration,
  pretty,
  size,
} from "../utils/formatters.js";

export function TorrentCard({ t, open, act, reload, notice }) {
  let checked =
    t.Files?.length && t.FilePriorities?.length
      ? t.Files.reduce(
          (a, f, i) => a + (t.FilePriorities[i] !== 0 ? f.Size : 0),
          0,
        )
      : t.TotalSize;
  return (
    <article className="torrent-card">
      <div className="card-top">
        <div className="torrent-title">
          <h2 title={t.Name}>{t.Name}</h2>
        </div>
        <div className="card-info-row">
          <div className="badges">
            <span className={"state-badge " + pretty(t.State)}>
              <span />
              {t.State}
            </span>
            <button
              className="label-badge"
              onClick={async () => {
                try {
                  let ls = await call("labels");
                  open({
                    type: "label",
                    id: t.Hash,
                    current: t.Label || "",
                    labels: ls,
                  });
                } catch (e) {
                  notice(e.message);
                }
              }}
            >
              <Tag size={11} />
              {t.Label || "no label"}
            </button>
            <span
              className="added-badge"
              title="Time since this torrent was added"
            >
              <Clock size={11} />
              Added {addedAgo(t.TimeAdded)}
            </span>
          </div>
        </div>
        <div className="card-controls-row">
          <span
            className="announce-badge"
            title="Time until next tracker announce"
          >
            <Clock size={11} />
            Announce in {announceTime(t.NextAnnounce)}
          </span>
          <div className="card-actions">
            <button
              title="Select files"
              onClick={() =>
                open({
                  type: "files",
                  torrent: t,
                })
              }
            >
              <FolderOpen size={16} />
            </button>
            <button
              title={t.State === "Paused" ? "Resume" : "Pause"}
              onClick={() =>
                act(
                  () =>
                    call(
                      `torrents/${t.State === "Paused" ? "resume" : "pause"}?id=${encodeURIComponent(t.Hash)}`,
                      {
                        method: "POST",
                      },
                    ),
                  t.State === "Paused" ? "Torrent resumed" : "Torrent paused",
                )
              }
            >
              {t.State === "Paused" ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              title="Force reannounce"
              aria-label="Force reannounce"
              onClick={() =>
                act(
                  () =>
                    call(`torrent/${t.Hash}/reannounce`, {
                      method: "POST",
                    }),
                  "Tracker reannounce requested",
                )
              }
            >
              <Radio size={16} />
            </button>
            <button
              className="remove"
              title="Remove"
              onClick={() =>
                open({
                  type: "delete",
                  items: [t.Hash],
                })
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="progress-meta">
        <span>
          <Clock size={13} />
          {duration(t.ETA)}
        </span>
        <span>
          <HardDrive size={13} />
          {size(checked || 0)}
        </span>
        <span className="progress-percent">
          {Number(t.Progress || 0).toFixed(1)}%
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, t.Progress || 0))}%`,
          }}
        />
      </div>
      <div className="card-bottom">
        <span>
          <ArrowDown size={13} />
          {size(t.DownloadPayloadRate)}/s
        </span>
        <span>
          <ArrowUp size={13} />
          {size(t.UploadPayloadRate)}/s
        </span>
        <span>
          <Activity size={13} />
          {t.SeedingTime ? duration(t.SeedingTime) : "0s"}
        </span>
        <span
          className={
            "ratio-value " +
            (t.Ratio < 1
              ? "ratio-low"
              : t.Ratio > 1 && t.Ratio < 3
                ? "ratio-good"
                : t.Ratio > 3
                  ? "ratio-high"
                  : "")
          }
          title="Upload/download ratio"
        >
          <span className="ratio-glyph">%</span>
          {Math.max(0, t.Ratio || 0).toFixed(2)}
        </span>
      </div>
    </article>
  );
}

export default TorrentCard;
