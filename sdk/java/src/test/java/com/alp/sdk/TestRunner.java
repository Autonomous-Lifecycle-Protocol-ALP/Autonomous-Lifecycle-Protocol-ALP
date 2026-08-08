package com.alp.sdk;

import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.platform.launcher.TestExecutionListener;
import org.junit.platform.launcher.TestIdentifier;
import org.junit.platform.engine.TestExecutionResult;
import org.junit.platform.engine.discovery.DiscoverySelectors;

import java.io.PrintWriter;

public class TestRunner {
    public static void main(String[] args) {
        LauncherDiscoveryRequest request = LauncherDiscoveryRequestBuilder.request()
                .selectors(DiscoverySelectors.selectClass(ProtocolBridgeTest.class))
                .selectors(DiscoverySelectors.selectClass(PredictivePolicyEngineTest.class))
                .selectors(DiscoverySelectors.selectClass(com.alp.sdk.HealingEngineTest.class))
                .build();
        Launcher launcher = LauncherFactory.create();
        SummaryGeneratingListener summaryListener = new SummaryGeneratingListener();
        launcher.registerTestExecutionListeners(summaryListener);
        launcher.registerTestExecutionListeners(new TestExecutionListener() {
            @Override
            public void testPlanExecutionStarted(org.junit.platform.launcher.TestPlan testPlan) {
                System.out.println("TEST PLAN STARTED");
            }
            @Override
            public void testPlanExecutionFinished(org.junit.platform.launcher.TestPlan testPlan) {
                System.out.println("TEST PLAN FINISHED");
            }
            @Override
            public void dynamicTestRegistered(TestIdentifier testIdentifier) {}
            @Override
            public void executionSkipped(TestIdentifier testIdentifier, String reason) {}
            @Override
            public void executionStarted(TestIdentifier testIdentifier) {
                if (testIdentifier.isTest()) {
                    System.out.println("START TEST: " + testIdentifier.getDisplayName());
                }
            }
            @Override
            public void executionFinished(TestIdentifier testIdentifier, TestExecutionResult testExecutionResult) {
                if (testIdentifier.isTest()) {
                    if (testExecutionResult.getStatus() == TestExecutionResult.Status.FAILED) {
                        System.out.println("FAIL TEST: " + testIdentifier.getDisplayName());
                        testExecutionResult.getThrowable().ifPresent(t -> t.printStackTrace(System.out));
                    } else if (testExecutionResult.getStatus() == TestExecutionResult.Status.ABORTED) {
                        System.out.println("ABORT TEST: " + testIdentifier.getDisplayName());
                        testExecutionResult.getThrowable().ifPresent(t -> t.printStackTrace(System.out));
                    }
                }
            }
            @Override
            public void reportingEntryPublished(TestIdentifier testIdentifier, org.junit.platform.engine.reporting.ReportEntry reportEntry) {}
        });
        try {
            launcher.execute(request);
        } catch (Exception e) {
            System.out.println("EXCEPTION during execute: " + e);
            e.printStackTrace(System.out);
        }
        System.out.println("=== SUMMARY ===");
        summaryListener.getSummary().printTo(new PrintWriter(System.out));
    }
}
