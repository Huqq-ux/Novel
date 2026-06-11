package com.novel.admin.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
public class CacheProtectionService {

    private static final Logger log = LoggerFactory.getLogger(CacheProtectionService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private DistributedLock distributedLock;

    public <T> T getWithNullProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit) {
        return getWithNullProtection(key, type, dbLoader, ttl, unit, false);
    }

    @SuppressWarnings("unchecked")
    public <T> T getWithNullProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit, boolean cacheNull) {
        try {
            Object cached = cacheService.get(key, Object.class).orElse(null);

            if (cached != null) {
                if (CacheConstants.NULL_CACHE_VALUE.equals(cached.toString())) {
                    log.debug("Null cache hit for key: {}", key);
                    return null;
                }
                if (type.isInstance(cached)) {
                    log.debug("Cache hit for key: {}", key);
                    return (T) cached;
                }
            }

            log.debug("Cache miss for key: {}, loading from database", key);
            T value = dbLoader.get();

            if (value != null) {
                long randomTtl = addRandomJitter(ttl, unit);
                cacheService.set(key, value, randomTtl, unit);
            } else if (cacheNull) {
                cacheService.set(key, CacheConstants.NULL_CACHE_VALUE,
                    CacheConstants.NULL_CACHE_TTL, CacheConstants.NULL_CACHE_UNIT);
            }

            return value;
        } catch (Exception e) {
            log.error("Cache protection error for key: {}", key, e);
            return dbLoader.get();
        }
    }

    public <T> T getWithLockProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit) {
        return getWithLockProtection(key, type, dbLoader, ttl, unit, false);
    }

    public <T> T getWithLockProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit, boolean cacheNull) {
        try {
            Object cached = cacheService.get(key, Object.class).orElse(null);

            if (cached != null) {
                if (CacheConstants.NULL_CACHE_VALUE.equals(cached.toString())) {
                    return null;
                }
                if (type.isInstance(cached)) {
                    return type.cast(cached);
                }
            }

            String lockValue = distributedLock.tryLockWithWait(key, 5, 30, TimeUnit.SECONDS);

            if (lockValue != null) {
                try {
                    cached = cacheService.get(key, Object.class).orElse(null);
                    if (cached != null && type.isInstance(cached)) {
                        return type.cast(cached);
                    }

                    T value = dbLoader.get();

                    if (value != null) {
                        long randomTtl = addRandomJitter(ttl, unit);
                        cacheService.set(key, value, randomTtl, unit);
                    } else if (cacheNull) {
                        cacheService.set(key, CacheConstants.NULL_CACHE_VALUE,
                            CacheConstants.NULL_CACHE_TTL, CacheConstants.NULL_CACHE_UNIT);
                    }

                    return value;
                } finally {
                    distributedLock.unlock(key, lockValue);
                }
            } else {
                log.warn("Could not acquire lock for key: {}, fallback to direct DB load", key);
                return dbLoader.get();
            }
        } catch (Exception e) {
            log.error("Lock protection error for key: {}", key, e);
            return dbLoader.get();
        }
    }

    public <T> void setWithRandomExpire(String key, T value, long baseTtl, TimeUnit unit) {
        long randomTtl = addRandomJitter(baseTtl, unit);
        cacheService.set(key, value, randomTtl, unit);
    }

    private long addRandomJitter(long baseTtl, TimeUnit unit) {
        long baseSeconds = unit.toSeconds(baseTtl);
        long jitter = ThreadLocalRandom.current().nextLong(0, Math.max(60, baseSeconds / 10));
        return baseSeconds + jitter;
    }

    public void evict(String key) {
        cacheService.delete(key);
    }

    public void evictByPattern(String pattern) {
        cacheService.deleteByPattern(pattern);
    }
}
