package alpgo

import (
	"fmt"
	"path/filepath"
	"sort"
)

type GraphNode struct {
	ID       string
	NodeType string
}

func NewGraphNode(id, nodeType string) *GraphNode {
	return &GraphNode{ID: id, NodeType: nodeType}
}

type AlpGraph struct {
	nodes     map[string]*GraphNode
	adjacency map[string][]string
}

func NewAlpGraph() *AlpGraph {
	return &AlpGraph{
		nodes:     make(map[string]*GraphNode),
		adjacency: make(map[string][]string),
	}
}

func (g *AlpGraph) BuildGraph(objects []*AlpObject) {
	g.nodes = make(map[string]*GraphNode)
	g.adjacency = make(map[string][]string)
	for _, obj := range objects {
		g.nodes[obj.ID] = NewGraphNode(obj.ID, obj.Type)
	}
	for _, obj := range objects {
		if depID, ok := obj.Properties["depends_on"].(string); ok {
			g.adjacency[depID] = append(g.adjacency[depID], obj.ID)
		}
	}
}

func (g *AlpGraph) TopologicalSort() []*GraphNode {
	inDegree := make(map[string]int)
	for nodeID := range g.nodes {
		inDegree[nodeID] = 0
	}
	for _, neighbors := range g.adjacency {
		for _, dep := range neighbors {
			inDegree[dep]++
		}
	}
	var queue []string
	for id, degree := range inDegree {
		if degree == 0 {
			queue = append(queue, id)
		}
	}
	sort.Strings(queue)
	var result []*GraphNode
	for len(queue) > 0 {
		nodeID := queue[0]
		queue = queue[1:]
		if node, ok := g.nodes[nodeID]; ok {
			result = append(result, node)
		}
		neighbors := g.adjacency[nodeID]
		var nextQueue []string
		for _, neighbor := range neighbors {
			inDegree[neighbor]--
			if inDegree[neighbor] == 0 {
				nextQueue = append(nextQueue, neighbor)
			}
		}
		sort.Strings(nextQueue)
		queue = append(queue, nextQueue...)
	}
	return result
}

func (g *AlpGraph) DetectCycles() {
	sorted := g.TopologicalSort()
	if len(sorted) != len(g.nodes) {
		panic("dependency cycle detected in ALP graph")
	}
}

func (g *AlpGraph) GetNode(id string) *GraphNode {
	return g.nodes[id]
}
