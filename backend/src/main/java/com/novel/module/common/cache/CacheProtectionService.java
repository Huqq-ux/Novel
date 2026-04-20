package com.novel.module.common.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * 缓存保护服务
 * 
 * 提供缓存穿透、缓存击穿、缓存雪崩等问题的防护机制。
 * 通过空值缓存、互斥锁、随机过期时间等策略保障缓存系统稳定性。
 * 
 * 设计考量：
 * 1. 缓存穿透防护：缓存空值，防止恶意请求穿透到数据库
 * 2. 缓存击穿防护：使用分布式锁，防止热点数据并发重建
 * 3. 缓存雪崩防护：随机过期时间，避免大量缓存同时失效
 * 4. 降级策略：缓存异常时直接访问数据库，保证服务可用
 */
@Component
public class CacheProtectionService {

    private static final Logger log = LoggerFactory.getLogger(CacheProtectionService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private DistributedLock distributedLock;

    /**
     * 带空值保护的缓存获取（不缓存空值）
     * 
     * 功能描述：
     * 从缓存获取数据，未命中则从数据库加载，不缓存空值。
     * 
     * @param key      缓存键
     * @param type     期望的返回类型
     * @param dbLoader 数据库加载器
     * @param ttl      缓存过期时间
     * @param unit     时间单位
     * @return T 缓存值或数据库加载的值
     */
    public <T> T getWithNullProtection(String key, Class<T> type, Supplier<T> dbLoader, 
                                        long ttl, TimeUnit unit) {
        return getWithNullProtection(key, type, dbLoader, ttl, unit, false);
    }

    /**
     * 带空值保护的缓存获取
     * 
     * 功能描述：
     * 从缓存获取数据，未命中则从数据库加载。
     * 支持缓存空值，防止缓存穿透。
     * 
     * 实现逻辑：
     * 1. 尝试从缓存获取数据
     * 2. 命中空值标记则返回null
     * 3. 命中有效数据则返回
     * 4. 未命中则从数据库加载
     * 5. 加载的数据存入缓存（带随机过期时间）
     * 6. 如果启用cacheNull且数据为null，缓存空值标记
     * 
     * 设计考量：
     * - 空值缓存时间较短（5分钟），避免占用过多内存
     * - 随机过期时间防止缓存雪崩
     * - 异常时降级到直接访问数据库
     * 
     * @param key       缓存键
     * @param type      期望的返回类型
     * @param dbLoader  数据库加载器
     * @param ttl       缓存过期时间
     * @param unit      时间单位
     * @param cacheNull 是否缓存空值
     * @return T 缓存值或数据库加载的值
     */
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

    /**
     * 带互斥锁保护的缓存获取（不缓存空值）
     * 
     * 功能描述：
     * 从缓存获取数据，未命中则使用分布式锁保护数据库加载过程。
     * 
     * @param key      缓存键
     * @param type     期望的返回类型
     * @param dbLoader 数据库加载器
     * @param ttl      缓存过期时间
     * @param unit     时间单位
     * @return T 缓存值或数据库加载的值
     */
    public <T> T getWithLockProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit) {
        return getWithLockProtection(key, type, dbLoader, ttl, unit, false);
    }

    /**
     * 带互斥锁保护的缓存获取
     * 
     * 功能描述：
     * 从缓存获取数据，未命中则使用分布式锁保护数据库加载过程。
     * 防止热点数据的缓存击穿问题。
     * 
     * 实现逻辑：
     * 1. 尝试从缓存获取数据
     * 2. 命中则直接返回
     * 3. 未命中则尝试获取分布式锁
     * 4. 获取锁成功后再次检查缓存（double-check）
     * 5. 从数据库加载数据并缓存
     * 6. 获取锁失败则直接访问数据库
     * 
     * 设计考量：
     * - 使用分布式锁防止并发重建缓存
     * - double-check模式避免重复加载
     * - 锁等待时间5秒，锁过期时间30秒
     * - 获取锁失败时降级到直接访问数据库
     * - 支持缓存空值防止穿透
     * 
     * @param key       缓存键
     * @param type      期望的返回类型
     * @param dbLoader  数据库加载器
     * @param ttl       缓存过期时间
     * @param unit      时间单位
     * @param cacheNull 是否缓存空值
     * @return T 缓存值或数据库加载的值
     */
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

    /**
     * 带随机过期时间的缓存设置
     * 
     * 功能描述：
     * 设置缓存值，过期时间为基准时间加上随机偏移。
     * 
     * 设计考量：
     * - 随机偏移防止大量缓存同时失效（缓存雪崩）
     * - 偏移范围为基准时间的10%或60秒（取较大值）
     * 
     * @param key     缓存键
     * @param value   缓存值
     * @param baseTtl 基准过期时间
     * @param unit    时间单位
     */
    public <T> void setWithRandomExpire(String key, T value, long baseTtl, TimeUnit unit) {
        long randomTtl = addRandomJitter(baseTtl, unit);
        cacheService.set(key, value, randomTtl, unit);
    }

    /**
     * 添加随机时间偏移
     * 
     * 功能描述：
     * 在基准过期时间上添加随机偏移，防止缓存雪崩。
     * 
     * 实现逻辑：
     * 1. 将基准时间转换为秒
     * 2. 计算偏移量（基准时间的10%或60秒，取较大值）
     * 3. 返回基准时间加上随机偏移
     * 
     * @param baseTtl 基准过期时间
     * @param unit    时间单位
     * @return long 添加随机偏移后的过期时间（秒）
     */
    private long addRandomJitter(long baseTtl, TimeUnit unit) {
        long baseSeconds = unit.toSeconds(baseTtl);
        long jitter = ThreadLocalRandom.current().nextLong(0, Math.max(60, baseSeconds / 10));
        return baseSeconds + jitter;
    }

    /**
     * 清除指定缓存
     * 
     * 功能描述：
     * 删除指定键的缓存数据。
     * 
     * @param key 缓存键
     */
    public void evict(String key) {
        cacheService.delete(key);
    }

    /**
     * 按模式批量清除缓存
     * 
     * 功能描述：
     * 删除匹配指定模式的所有缓存键。
     * 
     * @param pattern 键模式，如 "book:*"
     */
    public void evictByPattern(String pattern) {
        cacheService.deleteByPattern(pattern);
    }
}
