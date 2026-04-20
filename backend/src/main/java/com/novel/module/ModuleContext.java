package com.novel.module;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ModuleContext {
    
    private final Map<String, Module> modules = new ConcurrentHashMap<>();
    private final Map<String, Object> sharedResources = new ConcurrentHashMap<>();

    public void registerModule(Module module) {
        modules.put(module.getName(), module);
    }

    public Module getModule(String name) {
        return modules.get(name);
    }

    public <T> void registerSharedResource(String key, T resource) {
        sharedResources.put(key, resource);
    }

    @SuppressWarnings("unchecked")
    public <T> T getSharedResource(String key) {
        return (T) sharedResources.get(key);
    }

    public void initializeAll() {
        modules.values().forEach(Module::initialize);
    }

    public void shutdownAll() {
        modules.values().forEach(Module::shutdown);
    }

    public Map<String, Module> getAllModules() {
        return new ConcurrentHashMap<>(modules);
    }
}
