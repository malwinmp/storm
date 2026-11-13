package storm

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	deluge "github.com/malwinmp/go-libdeluge"
	"net/http"
	"sort"
)

type ViewTorrent struct {
	Hash                string
	Label               string
	TrackerHost         string
	State               string
	TrackerStatus       string
	NextAnnounce        int64
	Name                string
	TotalSize           int64
	Progress            float32
	ETA                 float32
	DownloadPayloadRate int64
	UploadPayloadRate   int64
	TotalUploaded       int64
	AllTimeDownload     int64
	Ratio               float32
	SeedingTime         int64
	TimeAdded           float32
}

type ViewSession struct {
	UploadRate    float32
	DownloadRate  float32
	TotalDownload int64
	TotalUpload   int64
	NumPeers      int16
	DhtNodes      int16
}

type ViewUpdate struct {
	Torrents []*ViewTorrent
	Session  *ViewSession
}

type ViewUpdateResponse struct {
	ViewUpdate
	ETag string
}

type torrentStatusFieldClient interface {
	TorrentsStatusFields(deluge.TorrentState, []string, []string) (map[string]*deluge.TorrentStatus, error)
}

type sessionStatusFieldClient interface {
	GetSessionStatusFields([]string) (*deluge.SessionStatus, error)
}

var viewTorrentFields = []string{
	"state", "tracker_host", "tracker_status", "next_announce", "name", "total_size", "progress",
	"eta", "download_payload_rate", "upload_payload_rate",
	"total_uploaded", "all_time_download", "ratio", "seeding_time", "time_added", "label",
}

var viewSessionFields = []string{
	"upload_rate", "download_rate", "total_download", "total_upload", "num_peers", "dht_nodes",
}

func httpViewUpdate(conn deluge.DelugeClient, r *http.Request) (interface{}, error) {
	var (
		q     = r.URL.Query()
		ids   = q["id"]
		state = deluge.TorrentState(q.Get("state"))
	)

	var torrents map[string]*deluge.TorrentStatus
	var err error
	if client, ok := conn.(torrentStatusFieldClient); ok {
		torrents, err = client.TorrentsStatusFields(state, ids, viewTorrentFields)
	} else {
		torrents, err = conn.TorrentsStatus(state, ids)
	}
	if err != nil {
		return nil, err
	}

	var torrentHashes = make([]string, 0, len(torrents))
	for k := range torrents {
		torrentHashes = append(torrentHashes, k)
	}
	sort.Strings(torrentHashes)

	var responseTorrents = make([]*ViewTorrent, 0, len(torrents))
	for _, k := range torrentHashes {
		torrent := torrents[k]
		responseTorrents = append(responseTorrents, &ViewTorrent{
			Hash:                k,
			Label:               torrent.Label,
			TrackerHost:         torrent.TrackerHost,
			State:               torrent.State,
			TrackerStatus:       torrent.TrackerStatus,
			NextAnnounce:        torrent.NextAnnounce,
			Name:                torrent.Name,
			TotalSize:           torrent.TotalSize,
			Progress:            torrent.Progress,
			ETA:                 torrent.ETA,
			DownloadPayloadRate: torrent.DownloadPayloadRate,
			UploadPayloadRate:   torrent.UploadPayloadRate,
			TotalUploaded:       torrent.TotalUploaded,
			AllTimeDownload:     torrent.AllTimeDownload,
			Ratio:               torrent.Ratio,
			SeedingTime:         torrent.SeedingTime,
			TimeAdded:           torrent.TimeAdded,
		})
	}

	var session *deluge.SessionStatus
	if client, ok := conn.(sessionStatusFieldClient); ok {
		session, err = client.GetSessionStatusFields(viewSessionFields)
	} else {
		session, err = conn.GetSessionStatus()
	}
	if err != nil {
		return nil, err
	}

	update := ViewUpdate{
		Torrents: responseTorrents,
		Session: &ViewSession{
			UploadRate:    session.UploadRate,
			DownloadRate:  session.DownloadRate,
			TotalDownload: session.TotalDownload,
			TotalUpload:   session.TotalUpload,
			NumPeers:      session.NumPeers,
			DhtNodes:      session.DhtNodes,
		},
	}

	// ETag calculation
	var h = sha1.New()
	_ = json.NewEncoder(h).Encode(&update)

	responseETag := hex.EncodeToString(h.Sum(nil))

	if requestETag := r.Header.Get("ETag"); requestETag != "" && requestETag == responseETag {
		return nil, &Error{
			Code:    http.StatusNotModified,
			Message: "View not modified since last request",
		}
	}

	return &ViewUpdateResponse{
		ViewUpdate: update,
		ETag:       responseETag,
	}, nil
}
