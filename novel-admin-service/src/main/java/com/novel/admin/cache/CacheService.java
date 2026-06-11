package com.novel.admin.cache;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public interface CacheService {

    void set(String key, Object value);

    void set(String key, Object value, long timeout, TimeUnit unit);

    <T> Optional<T> get(String key, Class<T> type);

    <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader);

    <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader, long timeout, TimeUnit unit);

    void delete(String key);

    void deleteByPattern(String pattern);

    boolean hasKey(String key);

    boolean expire(String key, long timeout, TimeUnit unit);

    long getExpire(String key);

    void increment(String key);

    void increment(String key, long delta);

    void decrement(String key);

    void decrement(String key, long delta);

    <T> boolean setIfAbsent(String key, T value, long timeout, TimeUnit unit);

    String buildKey(String prefix, Object... parts);
}
