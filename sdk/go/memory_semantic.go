package alpgo

import (
	"strings"
	"sync"
)

type MemoryNode struct {
	ID      string            `json:"id"`
	Content string            `json:"content"`
	Embed   []float64         `json:"embed,omitempty"`
	Meta    map[string]string `json:"meta,omitempty"`
}

type MemoryEdge struct {
	Source     string  `json:"source"`
	Target     string  `json:"target"`
	Weight     float64 `json:"weight"`
	Relation   string  `json:"relation"`
}

type SemanticGraph struct {
	mu     sync.RWMutex
	nodes  map[string]*MemoryNode
	edges  []MemoryEdge
}

func NewSemanticGraph() *SemanticGraph {
	return &SemanticGraph{
		nodes: make(map[string]*MemoryNode),
	}
}

func (g *SemanticGraph) AddNode(id, content string, meta map[string]string) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if meta == nil {
		meta = map[string]string{}
	}
	g.nodes[id] = &MemoryNode{ID: id, Content: content, Meta: meta}
}

func (g *SemanticGraph) AddEdge(source, target, relation string, weight float64) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.edges = append(g.edges, MemoryEdge{Source: source, Target: target, Weight: weight, Relation: relation})
}

func (g *SemanticGraph) Search(query string, threshold float64) []*MemoryNode {
	g.mu.RLock()
	defer g.mu.RUnlock()
	q := strings.ToLower(query)
	var results []*MemoryNode
	for _, n := range g.nodes {
		score := similarity(strings.ToLower(n.Content), q)
		if score >= threshold {
			results = append(results, n)
		}
	}
	return results
}

func (g *SemanticGraph) Consolidate() {
	g.mu.Lock()
	defer g.mu.Unlock()
	merged := map[string]bool{}
	var edges []MemoryEdge
	for _, e := range g.edges {
		key := e.Source + "->" + e.Target
		if merged[key] {
			continue
		}
		merged[key] = true
		edges = append(edges, e)
	}
	g.edges = edges
}

func similarity(a, b string) float64 {
	if len(a) == 0 || len(b) == 0 {
		return 0
	}
	wordsA := strings.Fields(a)
	wordsB := strings.Fields(b)
	common := 0
	for _, wa := range wordsA {
		for _, wb := range wordsB {
			if wa == wb {
				common++
			}
		}
	}
	denom := len(wordsA) + len(wordsB)
	if denom == 0 {
		return 0
	}
	return float64(common*2) / float64(denom)
}
