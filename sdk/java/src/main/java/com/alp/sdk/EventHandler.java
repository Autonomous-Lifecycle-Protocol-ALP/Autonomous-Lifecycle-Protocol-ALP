package com.alp.sdk;

@FunctionalInterface
public interface EventHandler {
    void onEvent(MeshEvent event);
}
