package handler

import (
	"encoding/json"
	"net/http"
)

// APIError is the standard error response format.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// writeJSON sends a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

// writeError sends a JSON error response.
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, APIError{Code: code, Message: message})
}
