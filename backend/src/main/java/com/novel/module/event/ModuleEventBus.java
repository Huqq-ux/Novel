package com.novel.module.event;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;
import java.util.function.Consumer;

@Component
public class ModuleEventBus {

    private final Map<String, List<Consumer<ModuleEvent>>> subscribers = new ConcurrentHashMap<>();

    public void subscribe(String eventType, Consumer<ModuleEvent> handler) {
        subscribers.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>()).add(handler);
    }

    public void unsubscribe(String eventType, Consumer<ModuleEvent> handler) {
        List<Consumer<ModuleEvent>> handlers = subscribers.get(eventType);
        if (handlers != null) {
            handlers.remove(handler);
        }
    }

    public void publish(ModuleEvent event) {
        List<Consumer<ModuleEvent>> handlers = subscribers.get(event.getType());
        if (handlers != null) {
            handlers.forEach(handler -> {
                try {
                    handler.accept(event);
                } catch (Exception e) {
                    System.err.println("Event handler error: " + e.getMessage());
                }
            });
        }
    }

    public void publish(String eventType, Object data) {
        publish(new ModuleEvent(eventType, data));
    }

    public void publish(String eventType, Object data, String sourceModule) {
        publish(new ModuleEvent(eventType, data, sourceModule));
    }
}
