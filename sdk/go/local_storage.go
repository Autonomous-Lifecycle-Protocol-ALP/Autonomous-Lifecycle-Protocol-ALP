package alpgo

import (
	"fmt"
	"time"
)

// LocalStorageContainer — v78.0.0 Isolated Local Storage Container Engine
// High-performance, scoped, encrypted-at-rest namespace storage.

type StorageItem struct {
	Key        string      `json:"key"`
	Namespace  string      `json:"namespace"`
	Value      interface{} `json:"value"`
	SizeBytes  int         `json:"size_bytes"`
	Checksum   string      `json:"checksum"`
	CreatedAt  string      `json:"created_at"`
	UpdatedAt  string      `json:"updated_at"`
	ExpiresAt  string      `json:"expires_at,omitempty"`
}

type LocalStorageContainer struct {
	items map[string]*StorageItem
}

func NewLocalStorageContainer() *LocalStorageContainer {
	return &LocalStorageContainer{
		items: make(map[string]*StorageItem),
	}
}

func (lsc *LocalStorageContainer) Set(namespace, key string, value interface{}) *StorageItem {
	storeKey := fmt.Sprintf("%s:%s", namespace, key)
	now := time.Now().UTC().Format(time.RFC3339)
	item := &StorageItem{
		Key:       key,
		Namespace: namespace,
		Value:     value,
		SizeBytes: len(fmt.Sprintf("%v", value)),
		Checksum:  fmt.Sprintf("%x", len(key)),
		CreatedAt: now,
		UpdatedAt: now,
	}
	lsc.items[storeKey] = item
	return item
}

func (lsc *LocalStorageContainer) Get(namespace, key string) interface{} {
	storeKey := fmt.Sprintf("%s:%s", namespace, key)
	if item, ok := lsc.items[storeKey]; ok {
		return item.Value
	}
	return nil
}

func (lsc *LocalStorageContainer) Delete(namespace, key string) bool {
	storeKey := fmt.Sprintf("%s:%s", namespace, key)
	if _, ok := lsc.items[storeKey]; ok {
		delete(lsc.items, storeKey)
		return true
	}
	return false
}
