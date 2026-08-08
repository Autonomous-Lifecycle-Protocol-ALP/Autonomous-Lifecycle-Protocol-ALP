package alpgo

import (
	"os"
	"path"
	"testing"
)

func TestMemoryStoreStoreAndRetrieve(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	entry := &MemoryEntry{
		ID:        "m1",
		Type:      "fact",
		Key:       "project",
		Value:     "ALP",
		Importance: ImportanceHigh,
		Scope:     "global",
	}
	store.Store(entry)

	results := store.Retrieve(MemoryQuery{})
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].Value != "ALP" {
		t.Errorf("expected ALP, got %s", results[0].Value)
	}
}

func TestMemoryStoreQueryFilters(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "a", Value: "1", Scope: "s1", Importance: ImportanceHigh})
	store.Store(&MemoryEntry{ID: "m2", Type: "fact", Key: "b", Value: "2", Scope: "s2", Importance: ImportanceLow})
	store.Store(&MemoryEntry{ID: "m3", Type: "task", Key: "c", Value: "3", Scope: "s1", Importance: ImportanceHigh})

	results := store.Retrieve(MemoryQuery{Scope: "s1"})
	if len(results) != 2 {
		t.Errorf("expected 2 results for scope s1, got %d", len(results))
	}

	results = store.Retrieve(MemoryQuery{Type: "task"})
	if len(results) != 1 || results[0].ID != "m3" {
		t.Errorf("expected 1 task result, got %d", len(results))
	}

	results = store.Retrieve(MemoryQuery{Key: "a"})
	if len(results) != 1 || results[0].ID != "m1" {
		t.Errorf("expected 1 result with key 'a', got %d", len(results))
	}
}

func TestMemoryStoreUpdateAndDelete(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "k", Value: "old", Scope: "global"})

	updated := store.Update("m1", "new")
	if updated == nil || updated.Value != "new" {
		t.Error("expected update to succeed")
	}

	deleted := store.Delete("m1")
	if !deleted {
		t.Error("expected delete to succeed")
	}
	if store.Size() != 0 {
		t.Error("expected store to be empty after delete")
	}
}

func TestMemoryStorePersistAndLoad(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "k", Value: "v", Scope: "global"})
	if err := store.Persist(); err != nil {
		t.Fatal(err)
	}

	store2 := NewMemoryStore(dir)
	if err := store2.Load(); err != nil {
		t.Fatal(err)
	}
	if store2.Size() != 1 {
		t.Errorf("expected size 1 after load, got %d", store2.Size())
	}
}

func TestMemoryStoreExpire(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "k", Value: "v", TTL: 0})
	store.Store(&MemoryEntry{ID: "m2", Type: "fact", Key: "k", Value: "v", TTL: 5000})
	removed := store.Expire()
	if removed != 0 {
		t.Errorf("expected 0 expired, got %d", removed)
	}
}

func TestMemoryStoreSummarize(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "k", Value: "v", Scope: "s1", Importance: ImportanceHigh})
	store.Store(&MemoryEntry{ID: "m2", Type: "task", Key: "k", Value: "v", Scope: "s1", Importance: ImportanceLow})

	summary := store.Summarize("s1")
	if summary["total"].(int) != 2 {
		t.Errorf("expected total 2, got %d", summary["total"])
	}
}

func TestMemoryStoreRAG(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "hello world", Value: "greeting", Scope: "global"})
	store.Store(&MemoryEntry{ID: "m2", Type: "fact", Key: "goodbye", Value: "farewell", Scope: "global"})

	results := store.RetrieveRAG("hello", 5)
	if len(results) == 0 {
		t.Error("expected at least 1 RAG result")
	}
	if results[0]["score"].(float64) <= 0 {
		t.Error("expected positive score")
	}
}

func TestMemoryStoreConsolidate(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "a", Value: "1", Scope: "s1"})
	store.Store(&MemoryEntry{ID: "m2", Type: "fact", Key: "b", Value: "2", Scope: "s1"})
	store.Store(&MemoryEntry{ID: "m3", Type: "fact", Key: "c", Value: "3", Scope: "s2"})

	results := store.Consolidate()
	if len(results) != 1 {
		t.Errorf("expected 1 consolidation, got %d", len(results))
	}
	sourceIDs, ok := results[0]["source_ids"].([]string)
	if !ok {
		t.Fatalf("expected source_ids to be []string, got %T", results[0]["source_ids"])
	}
	if len(sourceIDs) != 2 {
		t.Errorf("expected 2 source ids, got %d", len(sourceIDs))
	}
}

func TestMemoryGraphNeighbors(t *testing.T) {
	graph := NewMemoryGraph()
	graph.AddNode(&MemoryEntry{ID: "n1", Type: "fact", Key: "a", Value: "1"})
	graph.AddNode(&MemoryEntry{ID: "n2", Type: "fact", Key: "b", Value: "2"})
	graph.AddNode(&MemoryEntry{ID: "n3", Type: "fact", Key: "c", Value: "3"})

	if err := graph.Relate("n1", "n2", "link", 1.0); err != nil {
		t.Fatal(err)
	}
	if err := graph.Relate("n1", "n3", "link", 0.5); err != nil {
		t.Fatal(err)
	}

	neighbors := graph.Neighbors("n1", "link")
	if len(neighbors) != 2 {
		t.Errorf("expected 2 neighbors, got %d", len(neighbors))
	}
	if neighbors[0].ID != "n2" {
		t.Errorf("expected first neighbor to be n2, got %s", neighbors[0].ID)
	}
}

func TestMemoryGraphDecay(t *testing.T) {
	graph := NewMemoryGraph()
	graph.AddNode(&MemoryEntry{ID: "n1", Type: "fact", Key: "a", Value: "1", TTL: 1000})
	graph.Decay(0)
}

func TestMemoryConsolidator(t *testing.T) {
	consolidator := NewMemoryConsolidator()
	entries := []*MemoryEntry{
		{ID: "m1", Type: "fact", Key: "a", Value: "1", Scope: "s1"},
		{ID: "m2", Type: "fact", Key: "b", Value: "2", Scope: "s1"},
		{ID: "m3", Type: "fact", Key: "c", Value: "3", Scope: "s2"},
	}

	results := consolidator.Consolidate(entries)
	if len(results) != 1 {
		t.Errorf("expected 1 consolidation, got %d", len(results))
	}
	if len(results[0].SourceIDs) != 2 {
		t.Errorf("expected 2 source ids, got %d", len(results[0].SourceIDs))
	}
}

func TestMemoryStoreGetAll(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "a", Value: "1"})
	store.Store(&MemoryEntry{ID: "m2", Type: "task", Key: "b", Value: "2"})

	all := store.GetAll()
	if len(all) != 2 {
		t.Errorf("expected 2 entries, got %d", len(all))
	}
}

func TestMemoryStoreSize(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	if store.Size() != 0 {
		t.Error("expected empty store")
	}
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "a", Value: "1"})
	if store.Size() != 1 {
		t.Error("expected size 1")
	}
}

func TestMemoryStorePersistCreatesDirectory(t *testing.T) {
	dir, err := os.MkdirTemp("", "memory-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	store := NewMemoryStore(dir)
	store.Store(&MemoryEntry{ID: "m1", Type: "fact", Key: "a", Value: "1"})
	if err := store.Persist(); err != nil {
		t.Fatal(err)
	}

	alpDir := path.Join(dir, ".alp")
	if _, err := os.Stat(alpDir); os.IsNotExist(err) {
		t.Error("expected .alp directory to be created")
	}
}
