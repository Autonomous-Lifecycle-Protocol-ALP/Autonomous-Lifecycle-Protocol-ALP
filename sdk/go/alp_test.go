package alpgo

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseSingle(t *testing.T) {
	parser := &AlpParser{}
	obj, err := parser.ParseSingle("id: t1\ntype: task\n")
	assert.NoError(t, err)
	assert.Equal(t, "t1", obj.ID)
	assert.Equal(t, "task", obj.Type)
}

func TestParseMultiple(t *testing.T) {
	parser := &AlpParser{}
	objects, err := parser.Parse("id: t1\ntype: task\n\nid: t2\ntype: feature\n")
	assert.NoError(t, err)
	assert.Len(t, objects, 2)
	assert.Equal(t, "t1", objects[0].ID)
	assert.Equal(t, "t2", objects[1].ID)
}

func TestParseSingleEmpty(t *testing.T) {
	parser := &AlpParser{}
	_, err := parser.ParseSingle("")
	assert.Error(t, err)
}

func TestWorkspaceLoadString(t *testing.T) {
	workspace := NewAlpWorkspace()
	err := workspace.LoadString("id: t1\ntype: task\n")
	assert.NoError(t, err)
	assert.Len(t, workspace.Objects(), 1)
	assert.Equal(t, "t1", workspace.Objects()[0].ID)
}

func TestWorkspaceFindByID(t *testing.T) {
	workspace := NewAlpWorkspace()
	_ = workspace.LoadString("id: t1\ntype: task\n")
	assert.NotNil(t, workspace.FindByID("t1"))
	assert.Nil(t, workspace.FindByID("missing"))
}

func TestGraphTopologicalSort(t *testing.T) {
	graph := NewAlpGraph()
	t1 := NewAlpObject("t1", "task")
	t2 := NewAlpObject("t2", "task")
	t2.WithProperty("depends_on", "t1")
	graph.BuildGraph([]*AlpObject{t1, t2})

	order := graph.TopologicalSort()
	assert.Len(t, order, 2)
	assert.Equal(t, "t1", order[0].ID)
	assert.Equal(t, "t2", order[1].ID)
}

func TestGraphDetectCycles(t *testing.T) {
	graph := NewAlpGraph()
	t1 := NewAlpObject("t1", "task")
	t2 := NewAlpObject("t2", "task")
	t1.WithProperty("depends_on", "t2")
	t2.WithProperty("depends_on", "t1")
	graph.BuildGraph([]*AlpObject{t1, t2})

	assert.Panics(t, func() { graph.DetectCycles() })
}
