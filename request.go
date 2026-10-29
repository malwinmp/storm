package storm

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

const (
	// MaxRequestSize is the maximum allowed request size in bytes
	MaxRequestSize = 5 << 20
)

// Read reads JSON data from the request.
func Read(r *http.Request, into interface{}) error {
	defer r.Body.Close()
	body, err := io.ReadAll(io.LimitReader(r.Body, MaxRequestSize+1))
	if err != nil {
		return Hint(http.StatusBadRequest, err)
	}
	if len(body) > MaxRequestSize {
		return &Error{Code: http.StatusRequestEntityTooLarge, Message: "Request payload exceeds maximum limit"}
	}

	dec := json.NewDecoder(bytes.NewReader(body))
	err = dec.Decode(into)
	if err != nil {
		return Hint(http.StatusBadRequest, err)
	}
	if err = dec.Decode(new(interface{})); !errors.Is(err, io.EOF) {
		if err == nil {
			err = errors.New("request must contain one JSON value")
		}
		return Hint(http.StatusBadRequest, err)
	}

	return nil
}
