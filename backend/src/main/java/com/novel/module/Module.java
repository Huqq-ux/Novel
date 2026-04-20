package com.novel.module;

public interface Module {
    String getName();
    String getDescription();
    void initialize();
    void shutdown();
}
