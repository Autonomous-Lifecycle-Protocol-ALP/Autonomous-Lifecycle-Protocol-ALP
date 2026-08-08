package com.alp.sdk;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Reflector {
    private List<Map<String, Object>> events;

    public Reflector(List<Map<String, Object>> events) {
        this.events = events != null ? events : new ArrayList<>();
    }

    public List<Lesson> reflect(String runId) {
        List<Lesson> lessons = new ArrayList<>();
        lessons.addAll(detectFailurePatterns(runId));
        lessons.addAll(detectInefficiencies(runId));
        lessons.addAll(detectHandoffPatterns(runId));
        return lessons;
    }

    public Map<String, Object> improvePlan(Plan plan, List<Lesson> lessons, Map<String, Object> constraints) {
        if (plan == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("plan", null);
            result.put("proposals", new ArrayList<>());
            return result;
        }
        List<PlanNode> nodes = new ArrayList<>(plan.getNodes());
        Set<String> seen = new HashSet<>();
        List<ImprovementProposal> proposals = new ArrayList<>();
        for (Lesson lesson : lessons) {
            boolean hasFailure = lesson.getTags().contains("failure") && lesson.getInsight().contains("failed");
            boolean hasEfficiency = lesson.getTags().contains("efficiency") && lesson.getInsight().contains("claimed");
            boolean hasHandoff = lesson.getTags().contains("handoff");
            if (hasFailure) {
                String target = extractTaskId(lesson.getInsight());
                proposals.add(new ImprovementProposal(
                    "prop-" + (proposals.size() + 1), lesson.getLessonId(), target,
                    "add_dependency", "Add fallback or retry dependency for '" + target + "' due to repeated failures.", 0.75));
            }
            if (hasEfficiency) {
                String target = extractTaskId(lesson.getInsight());
                proposals.add(new ImprovementProposal(
                    "prop-" + (proposals.size() + 1), lesson.getLessonId(), target,
                    "reassign", "Reassign '" + target + "' to a more stable owner.", 0.6));
            }
            if (hasHandoff) {
                proposals.add(new ImprovementProposal(
                    "prop-" + (proposals.size() + 1), lesson.getLessonId(), null,
                    "add_node", "Add automation gate to reduce human handoff frequency.", 0.5));
            }
        }
        Integer maxNodes = null;
        if (constraints != null && constraints.get("max_nodes") instanceof Integer) {
            maxNodes = (Integer) constraints.get("max_nodes");
        }
        for (ImprovementProposal p : proposals) {
            if ("add_node".equals(p.getAction()) && !seen.contains(p.getProposalId())) {
                if (maxNodes != null && nodes.size() >= maxNodes) {
                    continue;
                }
                nodes.add(new PlanNode("node-" + p.getProposalId(), "task", p.getDetail(), new ArrayList<>()));
                seen.add(p.getProposalId());
            }
        }
        Plan improved = new Plan(plan.getPlanId(), plan.getGoal(), nodes, plan.getMetadata());
        improved.getMetadata().put("improvements", proposals.stream().map(ImprovementProposal::getAction).toList());
        Map<String, Object> result = new HashMap<>();
        result.put("plan", improved);
        result.put("proposals", proposals);
        return result;
    }

    private List<Lesson> detectFailurePatterns(String runId) {
        List<Lesson> lessons = new ArrayList<>();
        Map<String, Integer> taskFailures = new HashMap<>();
        for (Map<String, Object> e : events) {
            if ("task_status".equals(e.get("type")) && "[!]".equals(e.get("status"))) {
                String tid = (String) e.get("task_id");
                if (tid != null) {
                    taskFailures.merge(tid, 1, Integer::sum);
                }
            }
        }
        int idx = 1;
        for (Map.Entry<String, Integer> entry : taskFailures.entrySet()) {
            if (entry.getValue() >= 2) {
                lessons.add(new Lesson("lesson-" + idx++, runId,
                    "Task '" + entry.getKey() + "' failed " + entry.getValue() + " times; consider retry or fallback strategy.",
                    "warn", List.of("failure", entry.getKey())));
            }
        }
        return lessons;
    }

    private List<Lesson> detectInefficiencies(String runId) {
        List<Lesson> lessons = new ArrayList<>();
        Map<String, Integer> claimCounts = new HashMap<>();
        for (Map<String, Object> e : events) {
            if ("task_claim".equals(e.get("type"))) {
                String tid = (String) e.get("task_id");
                if (tid != null) {
                    claimCounts.merge(tid, 1, Integer::sum);
                }
            }
        }
        int idx = 1;
        for (Map.Entry<String, Integer> entry : claimCounts.entrySet()) {
            if (entry.getValue() >= 3) {
                lessons.add(new Lesson("lesson-" + idx++, runId,
                    "Task '" + entry.getKey() + "' was claimed " + entry.getValue() + " times; review ownership logic.",
                    "info", List.of("efficiency", entry.getKey())));
            }
        }
        return lessons;
    }

    private List<Lesson> detectHandoffPatterns(String runId) {
        int handoffs = 0;
        for (Map<String, Object> e : events) {
            if ("human_handoff".equals(e.get("type")) || "[?]".equals(e.get("status"))) {
                handoffs++;
            }
        }
        if (handoffs > 1) {
            return List.of(new Lesson("lesson-1", runId,
                "Run had " + handoffs + " human handoffs; consider automating or simplifying decision gates.",
                "warn", List.of("handoff")));
        }
        return List.of();
    }

    private String extractTaskId(String insight) {
        Matcher m = Pattern.compile("Task '([^']+)'").matcher(insight);
        if (m.find()) {
            return m.group(1);
        }
        return "unknown";
    }
}
