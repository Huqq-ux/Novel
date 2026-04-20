package com.novel.module;

import org.springframework.beans.factory.annotation.Autowired;
import com.novel.module.event.ModuleEventBus;

public abstract class AbstractModule implements Module {

    @Autowired
    protected ModuleContext moduleContext;

    @Autowired
    protected ModuleEventBus eventBus;

    protected String name;
    protected String description;

    public AbstractModule(String name, String description) {
        this.name = name;
        this.description = description;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getDescription() {
        return description;
    }

    @Override
    public void initialize() {
        moduleContext.registerModule(this);
        System.out.println("Module initialized: " + name);
    }

    @Override
    public void shutdown() {
        System.out.println("Module shutdown: " + name);
    }

    protected void publishEvent(String eventType, Object data) {
        eventBus.publish(eventType, data, name);
    }
}
