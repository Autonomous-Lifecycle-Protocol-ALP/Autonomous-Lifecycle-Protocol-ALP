package com.alp.sdk;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class BridgeExportResult {
    private final String format;
    private final Object spec;
    private final String sourceWorkflowId;
    private final List<String> warnings;

    public BridgeExportResult(String format, String sourceWorkflowId, Object spec) {
        this.format = format;
        this.sourceWorkflowId = sourceWorkflowId;
        this.spec = spec;
        this.warnings = Collections.emptyList();
    }

    public BridgeExportResult(String format, String sourceWorkflowId, Object spec, List<String> warnings) {
        this.format = format;
        this.sourceWorkflowId = sourceWorkflowId;
        this.spec = spec;
        this.warnings = warnings;
    }

    public String getFormat() {
        return format;
    }

    public Object getSpec() {
        return spec;
    }

    public String getSourceWorkflowId() {
        return sourceWorkflowId;
    }

    public List<String> getWarnings() {
        return warnings;
    }
}
