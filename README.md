# Storm

<p align="center"><img src="frontend/src/assets/logo.svg" height="160" alt="Storm logo"></p>

Storm is a responsive web interface for managing a Deluge client remotely. Its React frontend talks to a Go HTTP API, which connects to Deluge over RPC. The frontend bundle is embedded in the Go binary, so production can run as a single application container.

The interface supports viewing, adding, pausing, resuming, deleting, filtering, and labeling torrents, along with viewing session and disk information.

<p align="center">
  <img src="_docs/example-screen-1.jpg" alt="storm-s1" width="100%">
  <img src="_docs/example-screen-1.jpg" alt="storm-s2" width="100%">
</p>

## Run with Docker

Storm must be able to reach Deluge's RPC daemon. Put both containers on a Docker network and enable remote RPC in Deluge's `core.conf`:

```json
"allow_remote": true
```

Set these environment variables in your shell or secret manager before starting Storm. In production, `STORM_API_KEY` is required and may contain up to 32 characters. Use a unique random key; for a 32-character hexadecimal key, generate one with `openssl rand -hex 16`. The Deluge username and password must match an account in Deluge's `auth` file.

```sh
export STORM_API_KEY="$(openssl rand -hex 16)"
export DELUGE_RPC_HOSTNAME=deluge
export DELUGE_RPC_USERNAME=localclient
export DELUGE_RPC_PASSWORD='your-deluge-rpc-password'
```

Run the published image on the same Docker network as Deluge:

```sh
docker run --name storm \
  --network deluge \
  -p 127.0.0.1:8221:8221 \
  -e STORM_API_KEY \
  -e DELUGE_RPC_HOSTNAME \
  -e DELUGE_RPC_USERNAME \
  -e DELUGE_RPC_PASSWORD \
  ghcr.io/malwinmp/storm
```

The loopback binding is intended for a reverse proxy on the Docker host. To build the image from this repository instead, run `docker build -t storm:local .` and use `storm:local` as the image name.

The Compose example in `docker-compose/` runs Storm only; Deluge must already be running and reachable from Compose's default network. Attach the Deluge container to that network and set its reachable hostname as `DELUGE_RPC_HOSTNAME`. Set `DELUGE_RPC_USERNAME`, `DELUGE_RPC_PASSWORD`, and `STORM_API_KEY` in `docker-compose/.env`, then run `docker compose up -d` from that directory. The Compose example binds Storm to loopback for use behind a reverse proxy.

## Public access and security

The static frontend is public. In production, the API requires `STORM_API_KEY`; startup fails if the key is missing or longer than 32 characters. The UI prompts for the key when it first calls the API. After authentication, the server uses an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. The key is not persisted by the frontend in browser storage.

For internet access, terminate TLS at an HTTPS reverse proxy and forward the public hostname to Storm's loopback listener at `http://127.0.0.1:8221`. Do not publish Storm's HTTP port directly to the internet. Use a unique random API key and protect both it and the Deluge RPC credentials.

`--dev-mode` (or `DEV_MODE`) disables API authentication entirely and serves the built frontend from disk, even if an API key is configured. Use it only for local development.

## Configuration

Options can be supplied as command-line flags or environment variables.

| Environment variable | Purpose | Default |
| --- | --- | --- |
| `STORM_API_KEY` | API authentication key; maximum 32 characters | Required in production, unused in development mode |
| `STORM_BASE_PATH` | URL path prefix at which Storm is served | `/` |
| `LISTEN_ADDR` | HTTP listen address | `:8221` |
| `LOGGING_STYLE` | `console` or `production` logging | `console` |
| `DEV_MODE` | Serve frontend files from disk and disable API authentication | `false` |
| `DELUGE_RPC_VERSION` | Deluge RPC protocol version: `v1` or `v2` | `v1` |
| `DELUGE_RPC_HOSTNAME` | Deluge RPC host; required | — |
| `DELUGE_RPC_PORT` | Deluge RPC port | `58846` |
| `DELUGE_RPC_USERNAME` | Deluge RPC username | Empty |
| `DELUGE_RPC_PASSWORD` | Deluge RPC password | Empty |
| `POOL_MAX_CONNECTIONS` | Maximum concurrent Deluge RPC connections | `5` |
| `POOL_IDLE_TIME` | How long an idle Deluge RPC connection is kept | `30s` |

The command-line flags use the corresponding names, for example `--api-key`, `--base-path`, `--listen`, `--hostname`, and `--deluge-version`. Run `storm --help` for the complete list.

Deluge 2 restricts torrent visibility to the RPC account that added each torrent. Use the same Deluge account across clients if they need to manage the same torrents.

## Development

The frontend uses React, Vite, Tailwind CSS 4, and lucide-react. The backend uses Go 1.27.3. The Docker build uses Node.js 22 and Go 1.27.3.

Install the frontend dependencies and build the bundle first. The build output is embedded into the Go application and is also needed by `go:embed` when compiling locally.

```sh
cd frontend
npm ci
npm run build
```

In a separate terminal, run the backend in development mode. Set the Deluge RPC connection variables for your environment; `DELUGE_RPC_HOSTNAME` is required.

```sh
export DELUGE_RPC_HOSTNAME=127.0.0.1
export DELUGE_RPC_VERSION=v2
go run ./cmd/storm --listen=127.0.0.1:8221 --dev-mode
```

To run the Vite development server, open another terminal and run:

```sh
cd frontend
npm run start
```

Vite listens on `0.0.0.0:5173` and proxies `/api` requests to the backend at `127.0.0.1:8221`.
