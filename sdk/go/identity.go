package alpgo

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type AgentIdentity struct {
	DID        string
	AgentID    string
	PublicKey  string
	CreatedAt  string
	Metadata   map[string]any
}

func NewAgentIdentity(did, agentID, publicKey string, createdAt string, metadata map[string]any) *AgentIdentity {
	if createdAt == "" {
		createdAt = time.Now().Format(time.RFC3339)
	}
	if metadata == nil {
		metadata = make(map[string]any)
	}
	return &AgentIdentity{
		DID:        did,
		AgentID:    agentID,
		PublicKey:  publicKey,
		CreatedAt:  createdAt,
		Metadata:   metadata,
	}
}

func (i *AgentIdentity) ToDict() map[string]any {
	return map[string]any{
		"did":        i.DID,
		"agent_id":   i.AgentID,
		"public_key": i.PublicKey,
		"created_at": i.CreatedAt,
		"metadata":   i.Metadata,
	}
}

func AgentIdentityFromDict(d map[string]any) *AgentIdentity {
	did, _ := d["did"].(string)
	agentID, _ := d["agent_id"].(string)
	publicKey, _ := d["public_key"].(string)
	createdAt, _ := d["created_at"].(string)
	metadata, _ := d["metadata"].(map[string]any)
	return NewAgentIdentity(did, agentID, publicKey, createdAt, metadata)
}

type VerifiablePresentation struct {
	DID        string
	AgentID    string
	Claims     map[string]any
	Signature  string
	IssuedAt   string
}

func NewVerifiablePresentation(did, agentID string, claims map[string]any, signature, issuedAt string) *VerifiablePresentation {
	if issuedAt == "" {
		issuedAt = time.Now().Format(time.RFC3339)
	}
	return &VerifiablePresentation{
		DID:       did,
		AgentID:   agentID,
		Claims:    claims,
		Signature: signature,
		IssuedAt:  issuedAt,
	}
}

func (v *VerifiablePresentation) ToDict() map[string]any {
	return map[string]any{
		"did":       v.DID,
		"agent_id":  v.AgentID,
		"claims":    v.Claims,
		"signature": v.Signature,
		"issued_at": v.IssuedAt,
	}
}

func (v *VerifiablePresentation) Verify(publicKey string) bool {
	payload := fmt.Sprintf(`{"did":"%s","agent_id":"%s","claims":%v}`, v.DID, v.AgentID, v.Claims)
	expected := sha256Hex(payload + publicKey)
	return v.Signature == expected
}

type TrustEntry struct {
	AgentID     string
	Scopes      []string
	TrustLevel  string
	RegisteredAt string
}

func NewTrustEntry(agentID string, scopes []string, trustLevel, registeredAt string) *TrustEntry {
	if trustLevel == "" {
		trustLevel = "standard"
	}
	if registeredAt == "" {
		registeredAt = time.Now().Format(time.RFC3339)
	}
	return &TrustEntry{
		AgentID:     agentID,
		Scopes:      scopes,
		TrustLevel:  trustLevel,
		RegisteredAt: registeredAt,
	}
}

type TrustRegistry struct {
	AlpDir  string
	Entries map[string]*TrustEntry
}

func NewTrustRegistry(alpDir string) *TrustRegistry {
	t := &TrustRegistry{
		AlpDir:  alpDir,
		Entries: make(map[string]*TrustEntry),
	}
	t.Load()
	return t
}

func (t *TrustRegistry) identityDir() string {
	return filepath.Join(t.AlpDir, ".identity")
}

func (t *TrustRegistry) trustPath() string {
	return filepath.Join(t.identityDir(), "trust_registry.json")
}

func (t *TrustRegistry) Load() {
	p := t.trustPath()
	data, err := os.ReadFile(p)
	if err != nil {
		return
	}
	// Simple JSON parse not available without external lib; use simple line-based storage in production
	_ = data
}

func (t *TrustRegistry) Save() {
	d := t.identityDir()
	if err := os.MkdirAll(d, 0755); err != nil {
		return
	}
	// In production, serialize to JSON
	_ = d
}

func (t *TrustRegistry) Register(did, agentID string, scopes []string, trustLevel string) *TrustEntry {
	entry := NewTrustEntry(agentID, scopes, trustLevel, "")
	t.Entries[did] = entry
	t.Save()
	return entry
}

func (t *TrustRegistry) Resolve(did string) *TrustEntry {
	return t.Entries[did]
}

func (t *TrustRegistry) Revoke(did string) bool {
	if _, ok := t.Entries[did]; ok {
		delete(t.Entries, did)
		t.Save()
		return true
	}
	return false
}

func (t *TrustRegistry) ListDIDs() []string {
	dids := make([]string, 0, len(t.Entries))
	for did := range t.Entries {
		dids = append(dids, did)
	}
	return dids
}

func (t *TrustRegistry) HasScope(did, requiredScope string) bool {
	entry := t.Entries[did]
	if entry == nil {
		return false
	}
	for _, s := range entry.Scopes {
		if s == requiredScope {
			return true
		}
	}
	return false
}

type IdentityResolver struct {
	TrustRegistry *TrustRegistry
}

func NewIdentityResolver(trustRegistry *TrustRegistry) *IdentityResolver {
	return &IdentityResolver{TrustRegistry: trustRegistry}
}

func (r *IdentityResolver) VerifyPresentation(presentation *VerifiablePresentation, publicKey string) map[string]any {
	if !presentation.Verify(publicKey) {
		return map[string]any{"valid": false, "reason": "invalid_signature"}
	}
	entry := r.TrustRegistry.Resolve(presentation.DID)
	if entry == nil {
		return map[string]any{"valid": false, "reason": "unknown_did"}
	}
	return map[string]any{
		"valid":      true,
		"did":        presentation.DID,
		"agent_id":   presentation.AgentID,
		"scopes":     entry.Scopes,
		"trust_level": entry.TrustLevel,
	}
}

type KeyPair struct {
	PublicKey  string
	PrivateKey string
}

type AgentKeyStore struct {
	AlpDir string
	Keys   map[string]*KeyPair
}

func NewAgentKeyStore(alpDir string) *AgentKeyStore {
	ks := &AgentKeyStore{
		AlpDir: alpDir,
		Keys:   make(map[string]*KeyPair),
	}
	ks.Load()
	return ks
}

func (k *AgentKeyStore) identityDir() string {
	return filepath.Join(k.AlpDir, ".identity")
}

func (k *AgentKeyStore) keysPath() string {
	return filepath.Join(k.identityDir(), "agent_keys.json")
}

func (k *AgentKeyStore) Load() {
	p := k.keysPath()
	data, err := os.ReadFile(p)
	if err != nil {
		return
	}
	_ = data
}

func (k *AgentKeyStore) Save() {
	d := k.identityDir()
	if err := os.MkdirAll(d, 0755); err != nil {
		return
	}
	_ = d
}

func (k *AgentKeyStore) StoreKey(did, publicKey, privateKey string) {
	k.Keys[did] = &KeyPair{PublicKey: publicKey, PrivateKey: privateKey}
	k.Save()
}

func (k *AgentKeyStore) GetKey(did string) *KeyPair {
	return k.Keys[did]
}

func (k *AgentKeyStore) RemoveKey(did string) bool {
	if _, ok := k.Keys[did]; ok {
		delete(k.Keys, did)
		k.Save()
		return true
	}
	return false
}

func GenerateKeypair() *KeyPair {
	privateKey := strings.ReplaceAll(time.Now().Format(time.RFC3339Nano)+"-"+randomString(32), ":", "")
	publicKey := sha256Hex(privateKey)
	return &KeyPair{PublicKey: publicKey, PrivateKey: privateKey}
}

func CreateDID(agentID, publicKey string) string {
	keyHash := sha256Hex(publicKey)[:16]
	return "did:alp:" + agentID + ":" + keyHash
}

func sha256Hex(input string) string {
	h := sha256.Sum256([]byte(input))
	return hex.EncodeToString(h[:])
}

func randomString(n int) string {
	const letters = "abcdef0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}
