package com.alp.sdk;

import java.util.ArrayList;
import java.util.List;

public class Lesson {
    private String lessonId;
    private String runId;
    private String insight;
    private String severity;
    private List<String> tags;

    public Lesson(String lessonId, String runId, String insight, String severity, List<String> tags) {
        this.lessonId = lessonId;
        this.runId = runId;
        this.insight = insight;
        this.severity = severity;
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public String getLessonId() { return lessonId; }
    public String getRunId() { return runId; }
    public String getInsight() { return insight; }
    public String getSeverity() { return severity; }
    public List<String> getTags() { return tags; }
}
