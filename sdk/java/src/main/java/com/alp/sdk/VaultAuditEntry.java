package com.alp.sdk;

public class VaultAuditEntry {
    private String ts;
    private String action;
    private String id;
    private String by;

    public VaultAuditEntry() {}

    public VaultAuditEntry(String ts, String action, String id) {
        this.ts = ts;
        this.action = action;
        this.id = id;
        this.by = "anonymous";
    }

    public String getTs() { return ts; }
    public VaultAuditEntry setTs(String ts) { this.ts = ts; return this; }
    public String getAction() { return action; }
    public VaultAuditEntry setAction(String action) { this.action = action; return this; }
    public String getId() { return id; }
    public VaultAuditEntry setId(String id) { this.id = id; return this; }
    public String getBy() { return by; }
    public VaultAuditEntry setBy(String by) { this.by = by; return this; }
}
