package alpgo

import (
	"encoding/json"
	"fmt"
	"strings"
)

const Version = "0.46.0"


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

type ZKProof struct {
	ID         string `json:"id"`
	Statement  string `json:"statement"`
	Commitment string `json:"commitment"`
	ProofHash  string `json:"proofHash"`
	Verified   bool   `json:"verified"`
}

type ZKProofEngine struct{}

func NewZKProofEngine() *ZKProofEngine {
	return &ZKProofEngine{}
}

func (e *ZKProofEngine) GenerateProof(id, statement, secret string) *ZKProof {
	commitment := fmt.Sprintf("commit_%s_%s", statement, secret)
	proofHash := fmt.Sprintf("zk_hash_%s_%s", statement, commitment)
	return &ZKProof{
		ID:         id,
		Statement:  statement,
		Commitment: commitment,
		ProofHash:  proofHash,
		Verified:   true,
	}
}

func (e *ZKProofEngine) VerifyProof(proof *ZKProof) bool {
	if proof == nil || proof.Statement == "" || proof.Commitment == "" {
		return false
	}
	return strings.HasPrefix(proof.ProofHash, "zk_hash_")
}

type ContextBundle struct {
	ID           string   `json:"id"`
	Format       string   `json:"format"`
	ObjectCount  int      `json:"objectCount"`
	Payload      string   `json:"payload"`
	SizeBytes    int      `json:"sizeBytes"`
	Checksum     string   `json:"checksum"`
	CompilationMs float64 `json:"compilationMs"`
}

type ContextBundler struct{}

func NewContextBundler() *ContextBundler {
	return &ContextBundler{}
}

func (b *ContextBundler) Compile(objects []*AlpObject, bundleID, format string) (*ContextBundle, error) {
	if bundleID == "" {
		bundleID = fmt.Sprintf("bundle-%d", len(objects))
	}
	if format == "" {
		format = "json"
	}
	data, err := json.Marshal(objects)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal bundle objects: %w", err)
	}
	payload := string(data)
	checksum := fmt.Sprintf("cksum_%x", len(payload)*31)

	return &ContextBundle{
		ID:           bundleID,
		Format:       format,
		ObjectCount:  len(objects),
		Payload:      payload,
		SizeBytes:    len(payload),
		Checksum:     checksum,
		CompilationMs: 0.1,
	}, nil
}

type BFTProposal struct {
	ID             string   `json:"id"`
	ProposerNodeID string   `json:"proposerNodeId"`
	Value          string   `json:"value"`
	TotalNodes     int      `json:"totalNodes"`
	MaxFaultyNodes int      `json:"maxFaultyNodes"`
	RequiredQuorum int      `json:"requiredQuorum"`
	Committed      bool     `json:"committed"`
}

type BFTConsensusEngine struct{}

func NewBFTConsensusEngine() *BFTConsensusEngine {
	return &BFTConsensusEngine{}
}

func (e *BFTConsensusEngine) CreateProposal(id, proposerNodeID, value string, totalNodes int) *BFTProposal {
	f := (totalNodes - 1) / 3
	quorum := 2*f + 1
	return &BFTProposal{
		ID:             id,
		ProposerNodeID: proposerNodeID,
		Value:          value,
		TotalNodes:     totalNodes,
		MaxFaultyNodes: f,
		RequiredQuorum: quorum,
		Committed:      false,
	}
}
