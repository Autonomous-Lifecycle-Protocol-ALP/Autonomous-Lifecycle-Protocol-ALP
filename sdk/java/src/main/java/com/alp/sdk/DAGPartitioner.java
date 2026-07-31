package com.alp.sdk;

import java.util.ArrayList;
import java.util.List;

/**
 * DAG Partitioner for ALP v50.0.0.
 * Partitions dependency graphs across multi-region edge runners.
 */
public class DAGPartitioner {

    public static class RegionPartition {
        private final String region;
        private final List<String> nodeIds;
        private final double estimatedLatencyMs;

        public RegionPartition(String region, List<String> nodeIds, double estimatedLatencyMs) {
            this.region = region;
            this.nodeIds = nodeIds;
            this.estimatedLatencyMs = estimatedLatencyMs;
        }

        public String getRegion() { return region; }
        public List<String> getNodeIds() { return nodeIds; }
        public double getEstimatedLatencyMs() { return estimatedLatencyMs; }
    }

    public List<RegionPartition> partition(List<AlpObject> objects, List<String> regions) {
        List<String> targetRegions = (regions != null && !regions.isEmpty())
                ? regions
                : List.of("us-east", "eu-west", "ap-southeast");

        List<RegionPartition> partitions = new ArrayList<>();
        for (String r : targetRegions) {
            partitions.add(new RegionPartition(r, new ArrayList<>(), 1.8));
        }

        for (int i = 0; i < objects.size(); i++) {
            int idx = i % partitions.size();
            partitions.get(idx).getNodeIds().add(objects.get(i).getId());
        }

        return partitions;
    }
}
