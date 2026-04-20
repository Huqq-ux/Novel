package com.novel.module.event;

import java.time.LocalDateTime;

public class ModuleEvent {

    private String type;
    private Object data;
    private String sourceModule;
    private LocalDateTime timestamp;

    public ModuleEvent() {
        this.timestamp = LocalDateTime.now();
    }

    public ModuleEvent(String type, Object data) {
        this.type = type;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public ModuleEvent(String type, Object data, String sourceModule) {
        this.type = type;
        this.data = data;
        this.sourceModule = sourceModule;
        this.timestamp = LocalDateTime.now();
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getSourceModule() {
        return sourceModule;
    }

    public void setSourceModule(String sourceModule) {
        this.sourceModule = sourceModule;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
