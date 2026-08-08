package com.alp.sdk;

import java.util.Collections;
import java.util.List;
import java.util.Map;

public class BridgeImportResult {
    private final String format;
    private final Map<String, Object> workflow;
    private final Object sourceSpec;
    private final List<String> warnings;

    public BridgeImportResult(String format, Map<String, Object> workflow, Object sourceSpec) {
        this.format = format;
        this.workflow = workflow;
        this.sourceSpec = sourceSpec;
        this.warnings = Collections.emptyList();
    }

    public BridgeImportResult(String format, Map<String, Object> workflow, Object sourceSpec, List<String> warnings) {
        this.format = format;
        this.workflow = workflow;
        this.sourceSpec = sourceSpec;
        this.warnings = warnings;
    }

    public String getFormat() {
        return format;
    }

    public Map<String, Object> getWorkflow() {
        return workflow;
    }

    public Object getSourceSpec() {
        return sourceSpec;
    }

    public List<String> getWarnings() {
        return warnings;
    }
}
