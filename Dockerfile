FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build


FROM --platform=$BUILDPLATFORM golang:1.23-alpine AS backend
ARG TARGETOS
ARG TARGETARCH
ENV CGO_ENABLED=0
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
COPY --from=frontend /app/frontend/dist ./frontend/dist

RUN GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/storm ./cmd/storm


FROM alpine:3.21 AS runtime
RUN apk add --no-cache ca-certificates \
    && addgroup -S storm \
    && adduser -S -G storm storm
COPY --from=backend /out/storm /usr/local/bin/storm

USER storm
EXPOSE 8221
ENTRYPOINT ["/usr/local/bin/storm"]
