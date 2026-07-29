package alpgo

import (
	"fmt"
	"os"
	"path/filepath"
)

type AlpWorkspace struct {
	parser *AlpParser
	graph  *AlpGraph
	objects []*AlpObject
}

func NewAlpWorkspace() *AlpWorkspace {
	return &AlpWorkspace{
		parser: &AlpParser{},
		graph:  NewAlpGraph(),
	}
}

func (w *AlpWorkspace) Load(workspaceDir string) error {
	alpDir := filepath.Join(workspaceDir, ".alp")
	info, err := os.Stat(alpDir)
	if err != nil || !info.IsDir() {
		return nil
	}
	if err := w.loadDirectory(alpDir); err != nil {
		return err
	}
	w.graph.BuildGraph(w.objects)
	return nil
}

func (w *AlpWorkspace) LoadString(source string) error {
	objects, err := w.parser.Parse(source)
	if err != nil {
		return err
	}
	w.objects = append(w.objects, objects...)
	w.graph.BuildGraph(w.objects)
	return nil
}

func (w *AlpWorkspace) Objects() []*AlpObject {
	return w.objects
}

func (w *AlpWorkspace) Graph() *AlpGraph {
	return w.graph
}

func (w *AlpWorkspace) ExecutionOrder() []*GraphNode {
	return w.graph.TopologicalSort()
}

func (w *AlpWorkspace) FindByID(id string) *AlpObject {
	for _, obj := range w.objects {
		if obj.ID == id {
			return obj
		}
	}
	return nil
}

func (w *AlpWorkspace) loadDirectory(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("failed to read directory %s: %w", dir, err)
	}
	for _, entry := range entries {
		path := filepath.Join(dir, entry.Name())
		if entry.IsDir() {
			if err := w.loadDirectory(path); err != nil {
				return err
			}
		} else if filepath.Ext(path) == ".alp" {
			content, err := os.ReadFile(path)
			if err != nil {
				return fmt.Errorf("failed to read ALP file %s: %w", path, err)
			}
			objects, err := w.parser.Parse(string(content))
			if err != nil {
				return fmt.Errorf("failed to parse ALP file %s: %w", path, err)
			}
			w.objects = append(w.objects, objects...)
		}
	}
	return nil
}
