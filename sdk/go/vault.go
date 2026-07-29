package alpgo

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

type SealedSecret struct {
	ID         string
	Recipients []string
	Nonce      string
	Ciphertext string
	CreatedAt  string
	RotatedAt  *string
}

type VaultAuditEntry struct {
	TS    string
	Action string
	ID    string
	By    string
}

type Vault struct {
	secrets map[string]*SealedSecret
	audit   []*VaultAuditEntry
}

func NewVault() *Vault {
	return &Vault{
		secrets: make(map[string]*SealedSecret),
		audit:   []*VaultAuditEntry{},
	}
}

func (v *Vault) SetSecret(id, value string, recipients []string) {
	nonce := generateNonce()
	createdAt := time.Now().Format(time.RFC3339)
	secret := &SealedSecret{
		ID:         id,
		Recipients: recipients,
		Nonce:      nonce,
		Ciphertext: value,
		CreatedAt:  createdAt,
	}
	v.secrets[id] = secret
	v.audit = append(v.audit, &VaultAuditEntry{
		TS:     createdAt,
		Action: "set",
		ID:     id,
		By:     "anonymous",
	})
}

func (v *Vault) GetSecret(id string) (string, error) {
	secret, ok := v.secrets[id]
	if !ok {
		return "", fmt.Errorf("secret not found: %s", id)
	}
	ts := time.Now().Format(time.RFC3339)
	v.audit = append(v.audit, &VaultAuditEntry{
		TS:     ts,
		Action: "get",
		ID:     id,
		By:     "anonymous",
	})
	return secret.Ciphertext, nil
}

func (v *Vault) ListSecrets() []string {
	keys := make([]string, 0, len(v.secrets))
	for k := range v.secrets {
		keys = append(keys, k)
	}
	return keys
}

func (v *Vault) Audit() []*VaultAuditEntry {
	return v.audit
}

func generateNonce() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
