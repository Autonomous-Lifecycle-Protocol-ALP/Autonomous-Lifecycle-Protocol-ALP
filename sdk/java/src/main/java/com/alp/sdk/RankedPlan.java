package com.alp.sdk;

public class RankedPlan {
    private Plan plan;
    private PlanScore score;
    private int rank;

    public RankedPlan(Plan plan, PlanScore score) {
        this.plan = plan;
        this.score = score;
    }

    public Plan getPlan() { return plan; }
    public PlanScore getScore() { return score; }
    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }
}
