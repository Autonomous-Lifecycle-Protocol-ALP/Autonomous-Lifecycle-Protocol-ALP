package alpgo

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"sort"
	"strings"
	"sync"
	"time"
)

type MemoryType string
type MemoryImportance string

const (
	ImportanceMedium MemoryImportance = "medium"
	ImportanceHigh   MemoryImportance = "high"
	ImportanceLow    MemoryImportance = "low"
)

type MemoryEntry struct {
	ID        string            `json:"id"`
	Type      MemoryType        `json:"type"`
	Key       string            `json:"key"`
	Value     string            `json:"value"`
	Importance MemoryImportance `json:"importance"`
	Scope     string            `json:"scope,omitempty"`
	Source    string            `json:"source,omitempty"`
	TTL       int64             `json:"ttl,omitempty"`
	Created   string            `json:"created"`
	Updated   string            `json:"updated"`
}

func (e *MemoryEntry) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"id":         e.ID,
		"type":       e.Type,
		"key":        e.Key,
		"value":      e.Value,
		"importance": e.Importance,
		"scope":      e.Scope,
		"source":     e.Source,
		"ttl":        e.TTL,
		"created":    e.Created,
		"updated":    e.Updated,
	}
}

type MemoryQuery struct {
	Type       MemoryType
	Scope      string
	Key        string
	Importance MemoryImportance
}

type MemoryStore struct {
	mu       sync.RWMutex
	filePath string
	Entries  map[string]*MemoryEntry
}

func NewMemoryStore(projectRoot string) *MemoryStore {
	return &MemoryStore{
		filePath: path.Join(projectRoot, ".alp", ".memory.json"),
		Entries:  make(map[string]*MemoryEntry),
	}
}

func (s *MemoryStore) Load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			s.Entries = make(map[string]*MemoryEntry)
			return nil
		}
		return err
	}

	var raw []map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	s.Entries = make(map[string]*MemoryEntry, len(raw))
	for _, item := range raw {
		entry := &MemoryEntry{
			ID:        fmt.Sprintf("%v", item["id"]),
			Type:      MemoryType(fmt.Sprintf("%v", item["type"])),
			Key:       fmt.Sprintf("%v", item["key"]),
			Value:     fmt.Sprintf("%v", item["value"]),
			Importance: MemoryImportance(fmt.Sprintf("%v", item["importance"])),
			Scope:     fmt.Sprintf("%v", item["scope"]),
			Source:    fmt.Sprintf("%v", item["source"]),
			Created:   fmt.Sprintf("%v", item["created"]),
			Updated:   fmt.Sprintf("%v", item["updated"]),
		}
		if ttl, ok := item["ttl"].(float64); ok {
			entry.TTL = int64(ttl)
		}
		s.Entries[entry.ID] = entry
	}
	return nil
}

func (s *MemoryStore) Persist() error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	dir := path.Dir(s.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	entries := make([]map[string]interface{}, 0, len(s.Entries))
	for _, e := range s.Entries {
		entries = append(entries, e.ToMap())
	}

	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.filePath, data, 0644)
}

func (s *MemoryStore) Store(entry *MemoryEntry) *MemoryEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC().Format(time.RFC3339)
	if entry.Created == "" {
		entry.Created = now
	}
	entry.Updated = now
	if entry.Importance == "" {
		entry.Importance = ImportanceMedium
	}
	s.Entries[entry.ID] = entry
	return entry
}

func (s *MemoryStore) Retrieve(query MemoryQuery) []*MemoryEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	results := make([]*MemoryEntry, 0, len(s.Entries))
	for _, e := range s.Entries {
		if query.Type != "" && e.Type != query.Type {
			continue
		}
		if query.Scope != "" && e.Scope != query.Scope {
			continue
		}
		if query.Key != "" && !strings.Contains(e.Key, query.Key) {
			continue
		}
		if query.Importance != "" && e.Importance != query.Importance {
			continue
		}
		results = append(results, e)
	}
	return results
}

func (s *MemoryStore) Update(id string, value string) *MemoryEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry, ok := s.Entries[id]
	if !ok {
		return nil
	}
	entry.Value = value
	entry.Updated = time.Now().UTC().Format(time.RFC3339)
	return entry
}

func (s *MemoryStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.Entries[id]; ok {
		delete(s.Entries, id)
		return true
	}
	return false
}

func (s *MemoryStore) Summarize(scope string) map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entries := make([]*MemoryEntry, 0, len(s.Entries))
	for _, e := range s.Entries {
		if scope == "" || e.Scope == scope {
			entries = append(entries, e)
		}
	}

	byType := make(map[string]int)
	byImportance := make(map[string]int)
	for _, e := range entries {
		byType[string(e.Type)]++
		byImportance[string(e.Importance)]++
	}

	return map[string]interface{}{
		"total":         len(entries),
		"by_type":       byType,
		"by_importance": byImportance,
	}
}

func (s *MemoryStore) Expire() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UnixMilli()
	removed := 0
	for id, entry := range s.Entries {
		if entry.TTL > 0 {
			created, _ := time.Parse(time.RFC3339, entry.Created)
			age := now - created.UnixMilli()
			if age > entry.TTL {
				delete(s.Entries, id)
				removed++
			}
		}
	}
	return removed
}

func (s *MemoryStore) GetAll() []*MemoryEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	results := make([]*MemoryEntry, 0, len(s.Entries))
	for _, e := range s.Entries {
		results = append(results, e)
	}
	return results
}

func (s *MemoryStore) Size() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.Entries)
}

func (s *MemoryStore) RetrieveRAG(query string, limit int) []map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	q := strings.ToLower(query)
	terms := strings.Fields(q)
	if len(terms) == 0 {
		return nil
	}

	type scoredEntry struct {
		entry    *MemoryEntry
		score    float64
		citation string
	}

	scored := make([]scoredEntry, 0, len(s.Entries))
	for _, e := range s.Entries {
		haystack := strings.ToLower(fmt.Sprintf("%s %s %s", e.Key, e.Value, e.Type))
		matches := 0
		for _, t := range terms {
			if strings.Contains(haystack, t) {
				matches++
			}
		}
		score := float64(matches) / float64(len(terms))
		if score <= 0 {
			continue
		}
		citation := fmt.Sprintf("%s/%s/%s", func() string {
			if e.Scope != "" {
				return e.Scope
			}
			return "global"
		}(), e.Type, e.Key)
		scored = append(scored, scoredEntry{entry: e, score: score, citation: citation})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	results := make([]map[string]interface{}, 0, limit)
	for i, se := range scored {
		if i >= limit {
			break
		}
		results = append(results, map[string]interface{}{
			"entry":    se.entry,
			"score":    se.score,
			"citation": se.citation,
		})
	}
	return results
}

func (s *MemoryStore) Consolidate() []map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	byScope := make(map[string][]*MemoryEntry)
	for _, e := range s.Entries {
		scope := e.Scope
		if scope == "" {
			scope = "global"
		}
		byScope[scope] = append(byScope[scope], e)
	}

	results := make([]map[string]interface{}, 0)
	for _, scoped := range byScope {
		if len(scoped) < 2 {
			continue
		}
		parts := make([]string, 0, len(scoped))
		for _, e := range scoped {
			parts = append(parts, fmt.Sprintf("[%s] %s: %s", e.Type, e.Key, e.Value))
		}
		results = append(results, map[string]interface{}{
			"source_ids": func() []string {
				ids := make([]string, 0, len(scoped))
				for _, e := range scoped {
					ids = append(ids, e.ID)
				}
				return ids
			}(),
			"summary":    strings.Join(parts, "; "),
			"importance": "high",
			"created":    time.Now().UTC().Format(time.RFC3339),
		})
	}
	return results
}

type MemoryRelation struct {
	SourceID string  `json:"source_id"`
	TargetID string  `json:"target_id"`
	Relation string  `json:"relation"`
	Weight   float64 `json:"weight"`
}

type MemoryGraph struct {
	mu        sync.RWMutex
	Nodes     map[string]*MemoryEntry
	Relations []MemoryRelation
}

func NewMemoryGraph() *MemoryGraph {
	return &MemoryGraph{
		Nodes: make(map[string]*MemoryEntry),
	}
}

func (g *MemoryGraph) AddNode(entry *MemoryEntry) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.Nodes[entry.ID] = entry
}

func (g *MemoryGraph) Relate(sourceID, targetID, relation string, weight float64) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	if _, ok := g.Nodes[sourceID]; !ok {
		return fmt.Errorf("source node %s not found", sourceID)
	}
	if _, ok := g.Nodes[targetID]; !ok {
		return fmt.Errorf("target node %s not found", targetID)
	}
	g.Relations = append(g.Relations, MemoryRelation{
		SourceID: sourceID,
		TargetID: targetID,
		Relation: relation,
		Weight:   weight,
	})
	return nil
}

func (g *MemoryGraph) Neighbors(nodeID string, relation string) []*MemoryEntry {
	g.mu.RLock()
	defer g.mu.RUnlock()

	var related []MemoryRelation
	for _, r := range g.Relations {
		if r.SourceID == nodeID && (relation == "" || r.Relation == relation) {
			related = append(related, r)
		}
	}
	sort.Slice(related, func(i, j int) bool {
		return related[i].Weight > related[j].Weight
	})

	results := make([]*MemoryEntry, 0, len(related))
	for _, r := range related {
		if node, ok := g.Nodes[r.TargetID]; ok {
			results = append(results, node)
		}
	}
	return results
}

func (g *MemoryGraph) Decay(now int64) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if now == 0 {
		now = time.Now().UnixMilli()
	}
	for _, entry := range g.Nodes {
		if entry.TTL > 0 {
			created, _ := time.Parse(time.RFC3339, entry.Created)
			age := now - created.UnixMilli()
			_ = age
			entry.Updated = time.Now().UTC().Format(time.RFC3339)
		}
	}
}

type MemoryConsolidation struct {
	SourceIDs  []string `json:"source_ids"`
	Summary    string   `json:"summary"`
	Importance string   `json:"importance"`
	Created    string   `json:"created"`
}

type MemoryConsolidator struct{}

func NewMemoryConsolidator() *MemoryConsolidator {
	return &MemoryConsolidator{}
}

func (c *MemoryConsolidator) Consolidate(entries []*MemoryEntry) []MemoryConsolidation {
	byScope := make(map[string][]*MemoryEntry)
	for _, e := range entries {
		scope := e.Scope
		if scope == "" {
			scope = "global"
		}
		byScope[scope] = append(byScope[scope], e)
	}

	results := make([]MemoryConsolidation, 0)
	for _, scoped := range byScope {
		if len(scoped) < 2 {
			continue
		}
		parts := make([]string, 0, len(scoped))
		ids := make([]string, 0, len(scoped))
		for _, e := range scoped {
			parts = append(parts, fmt.Sprintf("[%s] %s: %s", e.Type, e.Key, e.Value))
			ids = append(ids, e.ID)
		}
		results = append(results, MemoryConsolidation{
			SourceIDs:  ids,
			Summary:    strings.Join(parts, "; "),
			Importance: "high",
			Created:    time.Now().UTC().Format(time.RFC3339),
		})
	}
	return results
}
