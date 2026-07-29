package alpgo

import (
	"fmt"
	"strings"
)

type AlpParser struct{}

func (p *AlpParser) Parse(source string) ([]*AlpObject, error) {
	blocks := strings.Split(source, "\n\n")
	var objects []*AlpObject
	for _, block := range blocks {
		trimmed := strings.TrimSpace(block)
		if trimmed == "" {
			continue
		}
		obj, err := p.parseBlock(trimmed)
		if err != nil {
			return nil, err
		}
		if obj != nil {
			objects = append(objects, obj)
		}
	}
	return objects, nil
}

func (p *AlpParser) ParseSingle(source string) (*AlpObject, error) {
	trimmed := strings.TrimSpace(source)
	if trimmed == "" {
		return nil, fmt.Errorf("empty source provided to parser")
	}
	result, err := p.parseBlock(trimmed)
	if err != nil {
		return nil, err
	}
	if result == nil {
		return nil, fmt.Errorf("failed to parse ALP block")
	}
	return result, nil
}

func (p *AlpParser) parseBlock(block string) (*AlpObject, error) {
	lines := strings.Split(block, "\n")
	var id, objectType string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "id:") {
			id = strings.TrimSpace(trimmed[3:])
		} else if strings.HasPrefix(trimmed, "type:") {
			objectType = strings.TrimSpace(trimmed[5:])
		}
	}
	if id == "" || objectType == "" {
		return nil, nil
	}
	return NewAlpObject(id, objectType), nil
}
