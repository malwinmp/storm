package storm

import (
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	deluge "github.com/malwinmp/go-libdeluge"
	"github.com/spf13/afero"
	"go.uber.org/zap"
	"html/template"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const (
	ApiAuthCookieName = "storm-api-key"
)

func appendSuffix(s, suffix string) string {
	if strings.HasSuffix(s, suffix) {
		return s
	}

	return fmt.Sprint(s, suffix)
}

func New(log *zap.Logger, pool *ConnectionPool, pathPrefix string, apiKey string, development bool, filterFiles ...string) *Api {
	filterFile := "filters.json"
	if len(filterFiles) > 0 && filterFiles[0] != "" {
		filterFile = filterFiles[0]
	}
	api := &Api{
		pool:       pool,
		pathPrefix: strings.TrimSuffix(pathPrefix, "/"),
		apiKey:     apiKey,
		log:        log,
		router:     mux.NewRouter(),
		filterFile: filterFile,
	}

	api.router.NotFoundHandler = api.httpNotFound()
	api.bind(development)

	return api
}

type Api struct {
	pool       *ConnectionPool
	pathPrefix string
	apiKey     string

	log        *zap.Logger
	router     *mux.Router
	filterFile string
	filterMu   sync.Mutex
}

type ViewFilter struct {
	Name         string         `json:"name"`
	State        string         `json:"state"`
	Sort         string         `json:"sort"`
	SortReverse  bool           `json:"sortReverse"`
	LabelFilters map[string]int `json:"labelFilters"`
}

func (api *Api) readFilters() ([]ViewFilter, error) {
	data, err := os.ReadFile(api.filterFile)
	if os.IsNotExist(err) {
		return []ViewFilter{}, nil
	}
	if err != nil {
		return nil, err
	}
	var filters []ViewFilter
	if err := json.Unmarshal(data, &filters); err != nil {
		return nil, err
	}
	if filters == nil {
		filters = []ViewFilter{}
	}
	for i := range filters {
		filters[i].Name = normalizeFilterName(filters[i].Name)
	}
	return filters, nil
}

func normalizeFilterName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func (api *Api) writeFilters(filters []ViewFilter) error {
	data, err := json.MarshalIndent(filters, "", "  ")
	if err != nil {
		return err
	}
	if dir := filepath.Dir(api.filterFile); dir != "." {
		if err := os.MkdirAll(dir, 0750); err != nil {
			return err
		}
	}
	tmp := api.filterFile + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, api.filterFile)
}

func (api *Api) httpViewFilters(rw http.ResponseWriter, r *http.Request) {
	api.filterMu.Lock()
	defer api.filterMu.Unlock()
	filters, err := api.readFilters()
	if err != nil {
		SendError(rw, &Error{Code: http.StatusInternalServerError, Message: "Failed to read view filters"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		_ = Handle(rw, r, func(*http.Request) (interface{}, error) { return filters, nil })
	case http.MethodPost:
		var filter ViewFilter
		if err := json.NewDecoder(http.MaxBytesReader(rw, r.Body, 1<<20)).Decode(&filter); err != nil {
			SendError(rw, &Error{Code: http.StatusBadRequest, Message: "Invalid filter"})
			return
		}
		filter.Name = normalizeFilterName(filter.Name)
		if filter.Name == "" || filter.State == "" || filter.Sort == "" {
			SendError(rw, &Error{Code: http.StatusBadRequest, Message: "Filter name and settings are required"})
			return
		}
		for _, existing := range filters {
			if normalizeFilterName(existing.Name) == filter.Name {
				SendError(rw, &Error{Code: http.StatusConflict, Message: "A view filter with this name already exists"})
				return
			}
		}
		if filter.LabelFilters == nil {
			filter.LabelFilters = map[string]int{}
		}
		filters = append(filters, filter)
		if err := api.writeFilters(filters); err != nil {
			SendError(rw, &Error{Code: http.StatusInternalServerError, Message: "Failed to save view filter"})
			return
		}
		_ = Handle(rw, r, func(*http.Request) (interface{}, error) { return filter, nil })
	default:
		SendError(rw, &Error{Code: http.StatusMethodNotAllowed, Message: "Method not allowed"})
	}
}

func (api *Api) httpDeleteViewFilter(rw http.ResponseWriter, r *http.Request) {
	api.filterMu.Lock()
	defer api.filterMu.Unlock()
	name := normalizeFilterName(mux.Vars(r)["name"])
	filters, err := api.readFilters()
	if err != nil {
		SendError(rw, &Error{Code: http.StatusInternalServerError, Message: "Failed to read view filters"})
		return
	}
	for i := range filters {
		if filters[i].Name == name {
			filters = append(filters[:i], filters[i+1:]...)
			if err := api.writeFilters(filters); err != nil {
				SendError(rw, &Error{Code: http.StatusInternalServerError, Message: "Failed to save view filters"})
				return
			}
			NoContent(rw)
			return
		}
	}
	SendError(rw, &Error{Code: http.StatusNotFound, Message: "Filter not found"})
}

func (api *Api) httpUpdateViewFilter(rw http.ResponseWriter, r *http.Request) {
	api.filterMu.Lock()
	defer api.filterMu.Unlock()
	var settings ViewFilter
	if err := json.NewDecoder(http.MaxBytesReader(rw, r.Body, 1<<20)).Decode(&settings); err != nil {
		SendError(rw, &Error{Code: http.StatusBadRequest, Message: "Invalid filter settings"})
		return
	}
	if settings.State == "" || settings.Sort == "" {
		SendError(rw, &Error{Code: http.StatusBadRequest, Message: "Filter settings are required"})
		return
	}
	filters, err := api.readFilters()
	if err != nil {
		SendError(rw, &Error{Code: http.StatusInternalServerError, Message: "Failed to read view filters"})
		return
	}
	name := normalizeFilterName(mux.Vars(r)["name"])
	for index := range filters {
		if filters[index].Name == name {
			filters[index].State = settings.State
			filters[index].Sort = settings.Sort
			filters[index].SortReverse = settings.SortReverse
			filters[index].LabelFilters = settings.LabelFilters
			if filters[index].LabelFilters == nil {
				filters[index].LabelFilters = map[string]int{}
			}
			if err := api.writeFilters(filters); err != nil {
				SendError(rw, &Error{Code: http.StatusInternalServerError, Message: "Failed to save view filter"})
				return
			}
			_ = Handle(rw, r, func(*http.Request) (interface{}, error) { return filters[index], nil })
			return
		}
	}
	SendError(rw, &Error{Code: http.StatusNotFound, Message: "Filter not found"})
}

func (api *Api) DelugeHandler(f DelugeMethod) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		_ = Handle(rw, r, func(r *http.Request) (interface{}, error) {
			conn, err := api.pool.Get(r.Context())
			if err != nil {
				return nil, err
			}

			ret, err := f(conn, r)
			api.pool.Put(conn)

			switch t := err.(type) {
			case deluge.RPCError:
				err = RPCError{
					ExceptionType:    t.ExceptionType,
					ExceptionMessage: t.ExceptionMessage,
				}
			}

			return ret, err
		})
	}
}

func (api *Api) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	setSecurityHeaders(rw)
	api.router.ServeHTTP(rw, r)
}

func setSecurityHeaders(rw http.ResponseWriter) {
	h := rw.Header()
	h.Set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'")
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("X-Frame-Options", "DENY")
	h.Set("Referrer-Policy", "no-referrer")
	h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
	h.Set("Strict-Transport-Security", "max-age=31536000")
}

// httpNotFound implements http.Handler which returns a not found error message.
func (api *Api) httpNotFound() http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		_ = Handle(rw, r, func(r *http.Request) (interface{}, error) {
			return nil, &Error{
				Message: "Not found",
				Code:    http.StatusNotFound,
			}
		})
	})
}

func (api *Api) templateContext() interface{} {
	path := appendSuffix(api.pathPrefix, "/")
	return map[string]string{
		"BasePath":    path,
		"BaseAPIPath": fmt.Sprint(path, "api/"),
	}
}

// renderTemplate takes the contents of a go html/template found at source `name`
// and renders it back to the file system using templateContext().
func (api *Api) renderTemplate(fs afero.Fs, name string) {
	log := api.log.With(zap.String("template", name))

	f, err := fs.Open(name)
	if err != nil {
		log.Error("failed to open template for rendering", zap.Error(err))
		return
	}

	templateSource, err := io.ReadAll(f)
	if err != nil {
		log.Error("failed to read template", zap.Error(err))
		return
	}

	_ = f.Close()

	t, err := template.New(name).Parse(string(templateSource))
	if err != nil {
		log.Error("failed to parse template", zap.Error(err))
		return
	}

	w, err := fs.OpenFile(name, os.O_WRONLY|os.O_TRUNC, os.FileMode(0600))
	if err != nil {
		log.Error("failed to open template file for writing", zap.Error(err))
		return
	}

	err = t.Execute(w, api.templateContext())
	if err != nil {
		log.Error("failed to render template", zap.Error(err))
		return
	}

	err = w.Close()
	if err != nil {
		log.Error("failed to close rendered template", zap.Error(err))
		return
	}
}

func (api *Api) bindStatic(router *mux.Router, development bool) {
	var static, _ = fs.Sub(Static, "frontend/dist")
	if development {
		static = os.DirFS("./frontend/dist")
	}

	var (
		mem = afero.NewMemMapFs()
		ufs = afero.NewCopyOnWriteFs(&afero.FromIOFS{
			FS: static,
		}, mem)
	)

	api.renderTemplate(ufs, "index.html")

	fileServer := http.FileServer(afero.NewHttpFs(ufs).Dir(""))
	if api.pathPrefix != "" {
		fileServer = http.StripPrefix(api.pathPrefix, fileServer)
	}

	router.Methods(http.MethodGet).Handler(fileServer)
}

// keyFromRequest attempts to locate the API key from the incoming request.
// It looks for the key using these methods in the following order:
//   - The password component of a Basic auth header
//   - The cookie value ApiAuthCookieName as a base64 encoded value
func (api *Api) keyFromRequest(r *http.Request) (string, bool) {
	_, password, ok := r.BasicAuth()
	if ok {
		return password, false
	}

	fromCookie, err := r.Cookie(ApiAuthCookieName)
	if err != nil {
		return "", false
	}

	fromCookieDecoded, _ := base64.StdEncoding.DecodeString(fromCookie.Value)

	return string(fromCookieDecoded), true
}

// logForRequest takes a WrappedResponse and an incoming HTTP request and logs it
func (api *Api) logForRequest(rw *WrappedResponse, r *http.Request) {
	logger := api.log.With(
		zap.String("Method", r.Method),
		zap.String("Path", r.URL.EscapedPath()),
		zap.String("RemoteAddr", r.RemoteAddr),
		zap.Time("Time", rw.Started()),
		zap.Int("StatusCode", rw.code),
		zap.Int("ResponseSize", rw.Len()),
		zap.Duration("Duration", rw.Duration()),
	)

	var logLevelFunc = logger.Info

	if rw.error != nil {
		// Do not log notification errors
		httpError, ok := rw.error.(HTTPError)
		if !ok || httpError.StatusCode() >= 400 {
			logLevelFunc = logger.With(zap.Error(rw.error)).Error
		}
	}

	logLevelFunc(http.StatusText(rw.code))
}

func (api *Api) httpMiddlewareLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		wr := WrapResponse(rw)

		next.ServeHTTP(wr, r)

		api.logForRequest(wr, r)
	})
}

func (api *Api) httpMiddlewareAuthenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		apiKey, fromCookie := api.keyFromRequest(r)
		if apiKey == "" {
			SendError(rw, &Error{
				Code:    http.StatusUnauthorized,
				Message: "No authentication provided in request",
			})
			return
		}

		ok := subtle.ConstantTimeCompare([]byte(api.apiKey), []byte(apiKey)) == 1
		if !ok {
			SendError(rw, &Error{
				Code:    http.StatusUnauthorized,
				Message: "Incorrect API key",
			})
			return
		}

		// If the request didn't originate from a cookie, then set the cookie
		if !fromCookie {
			http.SetCookie(rw, &http.Cookie{
				Name:     ApiAuthCookieName,
				Value:    base64.StdEncoding.EncodeToString([]byte(apiKey)),
				Path:     fmt.Sprintf("%s/api", api.pathPrefix),
				Expires:  time.Now().Add(time.Hour * 24 * 365),
				SameSite: http.SameSiteStrictMode,
				HttpOnly: true,
				Secure:   true,
			})
		}

		next.ServeHTTP(rw, r)
	})
}

func (api *Api) bind(development bool) {
	primaryRouter := api.router
	if api.pathPrefix != "" {
		primaryRouter = api.router.PathPrefix(api.pathPrefix).Subrouter()
	}

	router := primaryRouter.PathPrefix("/api").Subrouter()
	router.NotFoundHandler = api.httpNotFound()

	// CORS
	router.Methods(http.MethodOptions).HandlerFunc(func(rw http.ResponseWriter, request *http.Request) {
		rw.WriteHeader(http.StatusOK)
	})

	apiRouter := router.NewRoute().Subrouter()
	apiRouter.Use(api.httpMiddlewareLog)

	// Enable API level authentication
	if !development {
		apiRouter.Use(api.httpMiddlewareAuthenticate)
	}

	apiRouter.
		Methods(http.MethodGet).
		Path("/ping").
		HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
			rw.WriteHeader(http.StatusNoContent)
		})

	apiRouter.HandleFunc("/view-filters", api.httpViewFilters).Methods(http.MethodGet, http.MethodPost)
	apiRouter.HandleFunc("/view-filters/{name}", api.httpDeleteViewFilter).Methods(http.MethodDelete)
	apiRouter.HandleFunc("/view-filters/{name}", api.httpUpdateViewFilter).Methods(http.MethodPut)

	apiRouter.
		Methods(http.MethodGet).
		Path("/session").
		HandlerFunc(api.DelugeHandler(httpGetSessionStatus))

	apiRouter.
		Methods(http.MethodGet).
		Path("/disk/free").
		HandlerFunc(api.DelugeHandler(httpGetFreeSpace))

	apiRouter.
		Methods(http.MethodGet).
		Path("/view").
		HandlerFunc(api.DelugeHandler(httpViewUpdate))

	apiRouter.
		Methods(http.MethodGet).
		Path("/plugins").
		HandlerFunc(api.DelugeHandler(httpGetPlugins))

	apiRouter.
		Methods(http.MethodPost).
		Path("/plugins/{id}").
		HandlerFunc(api.DelugeHandler(httpEnablePlugin))

	apiRouter.
		Methods(http.MethodDelete).
		Path("/plugins/{id}").
		HandlerFunc(api.DelugeHandler(httpDisablePlugin))

	apiRouter.
		Methods(http.MethodGet).
		Path("/torrents").
		HandlerFunc(api.DelugeHandler(httpTorrentsStatus))
	apiRouter.
		Methods(http.MethodPost).
		Path("/torrents").
		HandlerFunc(api.DelugeHandler(httpAddTorrent))
	apiRouter.
		Methods(http.MethodDelete).
		Path("/torrents").
		HandlerFunc(api.DelugeHandler(httpDeleteTorrents))
	apiRouter.
		Methods(http.MethodPost).
		Path("/torrents/pause").
		HandlerFunc(api.DelugeHandler(httpPauseTorrents))
	apiRouter.
		Methods(http.MethodPost).
		Path("/torrents/resume").
		HandlerFunc(api.DelugeHandler(httpResumeTorrents))
	apiRouter.
		Methods(http.MethodPost).
		Path("/torrents/reannounce").
		HandlerFunc(api.DelugeHandler(httpForceReannounceTorrents))

	apiRouter.
		Methods(http.MethodGet).
		Path("/torrent/{id}").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpTorrentStatus)))
	apiRouter.
		Methods(http.MethodGet).
		Path("/torrent/{id}/files").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpTorrentFiles)))
	apiRouter.
		Methods(http.MethodDelete).
		Path("/torrent/{id}").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpDeleteTorrent)))
	apiRouter.
		Methods(http.MethodPut).
		Path("/torrent/{id}").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpSetTorrentOptions)))
	apiRouter.
		Methods(http.MethodPost).
		Path("/torrent/{id}/pause").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpPauseTorrent)))
	apiRouter.
		Methods(http.MethodPost).
		Path("/torrent/{id}/resume").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpResumeTorrent)))
	apiRouter.
		Methods(http.MethodPost).
		Path("/torrent/{id}/reannounce").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpForceReannounceTorrent)))

	apiRouter.
		Methods(http.MethodGet).
		Path("/labels").
		HandlerFunc(api.DelugeHandler(httpLabels))

	apiRouter.
		Methods(http.MethodPost).
		Path("/labels/{id}").
		HandlerFunc(api.DelugeHandler(httpCreateLabel))

	apiRouter.
		Methods(http.MethodDelete).
		Path("/labels/{id}").
		HandlerFunc(api.DelugeHandler(httpDeleteLabel))

	apiRouter.
		Methods(http.MethodGet).
		Path("/torrents/labels").
		HandlerFunc(api.DelugeHandler(httpTorrentsLabels))

	apiRouter.
		Methods(http.MethodPost).
		Path("/torrent/{id}/label").
		HandlerFunc(api.DelugeHandler(TorrentHandler(httpSetTorrentLabel)))

	// Static files
	api.bindStatic(primaryRouter, development)
}
