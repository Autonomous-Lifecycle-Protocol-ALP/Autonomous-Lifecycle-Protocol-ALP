package alpgo

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type AlpObject struct {
	ID        string
	Type      string
	Properties map[string]any
}

func NewAlpObject(id, objectType string) *AlpObject {
	return &AlpObject{
		ID:        id,
		Type:      objectType,
		Properties: make(map[string]any),
	}
}

func (o *AlpObject) WithProperty(key string, value any) *AlpObject {
	o.Properties[key] = value
	return o
}

func (o *AlpObject) ToJSON() (string, error) {
	data, err := json.MarshalIndent(o, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to serialize AlpObject: %w", err)
	}
	return string(data), nil
}

func AlpObjectFromJSON(jsonStr string) (*AlpObject, error) {
	var obj AlpObject
	if err := json.Unmarshal([]byte(jsonStr), &obj); err != nil {
		return nil, fmt.Errorf("failed to parse AlpObject from JSON: %w", err)
	}
	return &obj, nil
}
