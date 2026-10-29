import {
  ArrowDown,
  ArrowUp,
  Download,
  HardDrive,
  Users,
  Upload,
} from "lucide-react";
import { size } from "../utils/formatters.js";

export function StatusBar({ connected, session, disk }) {
  return (
    <footer className="statusbar">
      <span className="connection">
        <span className={`connection-dot ${connected ? "" : "offline"}`} />
        {connected ? "Connected" : "Disconnected"}
      </span>
      <span className="status-divider" />
      <span>
        <Users size={14} />
        {session.NumPeers || 0}
        <small>/ {session.DhtNodes || 0}</small>
      </span>
      <span>
        <ArrowDown size={14} />
        {size(session.DownloadRate)}/s
      </span>
      <span>
        <ArrowUp size={14} />
        {size(session.UploadRate)}/s
      </span>
      <span className="status-spacer" />
      <span className="totals">
        <Download size={14} />
        {size(session.TotalDownload)}
      </span>
      <span className="totals">
        <Upload size={14} />
        {size(session.TotalUpload)}
      </span>
      <span>
        <HardDrive size={14} />
        {size(disk)} free
      </span>
    </footer>
  );
}
