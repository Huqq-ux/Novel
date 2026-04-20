package com.novel.module.common.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * 缓存服务实现类
 * 
 * 提供Redis缓存的基础操作封装，包括存取、删除、过期设置等功能。
 * 所有操作均包含异常处理，确保缓存故障不影响主业务流程。
 * 
 * 设计考量：
 * 1. 异常捕获：所有Redis操作捕获异常并记录日志，避免缓存故障影响业务
 * 2. 泛型支持：使用泛型方法支持任意类型的缓存对象
 * 3. Optional返回：使用Optional包装返回值，明确表示可能不存在
 * 4. Supplier模式：支持懒加载数据源，避免不必要的数据库查询
 */
@Service
public class CacheServiceImpl implements CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheServiceImpl.class);

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 存储缓存值（无过期时间）
     * 
     * 功能描述：
     * 将指定值存入Redis缓存，不设置过期时间。
     * 
     * 实现逻辑：
     * 1. 调用RedisTemplate的set方法存储值
     * 2. 异常时记录日志，不抛出异常
     * 
     * 设计考量：
     * - 无过期时间适用于永久性缓存
     * - 异常静默处理，避免影响主业务流程
     * 
     * @param key   缓存键
     * @param value 缓存值
     */
    @Override
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
        } catch (Exception e) {
            log.error("Redis set error for key: {}", key, e);
        }
    }

    /**
     * 存储缓存值（带过期时间）
     * 
     * 功能描述：
     * 将指定值存入Redis缓存，并设置过期时间。
     * 
     * 实现逻辑：
     * 1. 调用RedisTemplate的set方法存储值
     * 2. 设置指定的过期时间
     * 
     * 设计考量：
     * - 过期时间防止缓存无限增长
     * - 支持多种时间单位，灵活配置
     * 
     * @param key     缓存键
     * @param value   缓存值
     * @param timeout 过期时间
     * @param unit    时间单位
     */
    @Override
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
        } catch (Exception e) {
            log.error("Redis set with TTL error for key: {}", key, e);
        }
    }

    /**
     * 获取缓存值
     * 
     * 功能描述：
     * 根据键获取缓存值，返回Optional包装。
     * 
     * 实现逻辑：
     * 1. 调用RedisTemplate的get方法获取值
     * 2. 类型校验确保返回值类型正确
     * 3. 返回Optional包装的结果
     * 
     * 设计考量：
     * - 使用Optional明确表示值可能不存在
     * - 类型校验防止类型转换异常
     * - 异常时返回empty，不影响业务流程
     * 
     * @param key  缓存键
     * @param type 期望的返回类型
     * @return Optional<T> 缓存值，不存在或类型不匹配返回empty
     */
    @Override
    @SuppressWarnings("unchecked")
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null && type.isInstance(value)) {
                return Optional.of((T) value);
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Redis get error for key: {}", key, e);
            return Optional.empty();
        }
    }

    /**
     * 获取缓存或加载数据（默认30分钟过期）
     * 
     * 功能描述：
     * 尝试从缓存获取数据，未命中则从数据源加载并缓存。
     * 
     * @param key    缓存键
     * @param type   期望的返回类型
     * @param loader 数据加载器
     * @return T 缓存值或加载的数据
     */
    @Override
    public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
        return getOrLoad(key, type, loader, 30, TimeUnit.MINUTES);
    }

    /**
     * 获取缓存或加载数据（自定义过期时间）
     * 
     * 功能描述：
     * 尝试从缓存获取数据，未命中则从数据源加载并缓存。
     * 
     * 实现逻辑：
     * 1. 尝试从缓存获取数据
     * 2. 缓存命中则直接返回
     * 3. 缓存未命中则调用loader加载数据
     * 4. 加载的数据存入缓存
     * 
     * 设计考量：
     * - 使用Supplier实现懒加载，避免不必要的数据库查询
     * - null值不缓存，防止缓存穿透
     * - 记录缓存命中/未命中日志，便于监控
     * 
     * @param key     缓存键
     * @param type    期望的返回类型
     * @param loader  数据加载器
     * @param timeout 过期时间
     * @param unit    时间单位
     * @return T 缓存值或加载的数据
     */
    @Override
    public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader, long timeout, TimeUnit unit) {
        Optional<T> cached = get(key, type);
        if (cached.isPresent()) {
            log.debug("Cache hit for key: {}", key);
            return cached.get();
        }

        log.debug("Cache miss for key: {}, loading from source", key);
        T value = loader.get();
        if (value != null) {
            set(key, value, timeout, unit);
        }
        return value;
    }

    /**
     * 删除缓存
     * 
     * 功能描述：
     * 删除指定键的缓存数据。
     * 
     * @param key 缓存键
     */
    @Override
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Redis delete error for key: {}", key, e);
        }
    }

    /**
     * 按模式批量删除缓存
     * 
     * 功能描述：
     * 删除匹配指定模式的所有缓存键。
     * 
     * 实现逻辑：
     * 1. 使用keys命令查找匹配的键
     * 2. 批量删除找到的键
     * 
     * 设计考量：
     * - 用于批量清除相关缓存
     * - 注意：keys命令在生产环境慎用，大数据量时可能阻塞
     * 
     * @param pattern 键模式，如 "book:*"
     */
    @Override
    public void deleteByPattern(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.error("Redis delete by pattern error for pattern: {}", pattern, e);
        }
    }

    /**
     * 检查键是否存在
     * 
     * 功能描述：
     * 检查指定键是否存在于缓存中。
     * 
     * @param key 缓存键
     * @return boolean 存在返回true，不存在或异常返回false
     */
    @Override
    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Redis hasKey error for key: {}", key, e);
            return false;
        }
    }

    /**
     * 设置键的过期时间
     * 
     * 功能描述：
     * 为已存在的缓存键设置过期时间。
     * 
     * @param key     缓存键
     * @param timeout 过期时间
     * @param unit    时间单位
     * @return boolean 设置成功返回true
     */
    @Override
    public boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            return Boolean.TRUE.equals(redisTemplate.expire(key, timeout, unit));
        } catch (Exception e) {
            log.error("Redis expire error for key: {}", key, e);
            return false;
        }
    }

    /**
     * 获取键的剩余过期时间
     * 
     * 功能描述：
     * 获取指定键的剩余过期时间（秒）。
     * 
     * @param key 缓存键
     * @return long 剩余秒数，-1表示永不过期，-2表示不存在
     */
    @Override
    public long getExpire(String key) {
        try {
            Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            return expire != null ? expire : -2;
        } catch (Exception e) {
            log.error("Redis getExpire error for key: {}", key, e);
            return -2;
        }
    }

    /**
     * 递增缓存值
     * 
     * 功能描述：
     * 将指定键的值递增1。
     * 
     * @param key 缓存键
     */
    @Override
    public void increment(String key) {
        increment(key, 1);
    }

    /**
     * 递增缓存值（指定增量）
     * 
     * 功能描述：
     * 将指定键的值递增指定数量。
     * 
     * 设计考量：
     * - 用于计数器场景，如点击量、点赞数
     * - 如果键不存在，初始值为0再递增
     * 
     * @param key   缓存键
     * @param delta 递增量
     */
    @Override
    public void increment(String key, long delta) {
        try {
            redisTemplate.opsForValue().increment(key, delta);
        } catch (Exception e) {
            log.error("Redis increment error for key: {}", key, e);
        }
    }

    /**
     * 递减缓存值
     * 
     * 功能描述：
     * 将指定键的值递减1。
     * 
     * @param key 缓存键
     */
    @Override
    public void decrement(String key) {
        decrement(key, 1);
    }

    /**
     * 递减缓存值（指定减量）
     * 
     * 功能描述：
     * 将指定键的值递减指定数量。
     * 
     * @param key   缓存键
     * @param delta 递减量
     */
    @Override
    public void decrement(String key, long delta) {
        try {
            redisTemplate.opsForValue().decrement(key, delta);
        } catch (Exception e) {
            log.error("Redis decrement error for key: {}", key, e);
        }
    }

    /**
     * 仅当键不存在时设置值
     * 
     * 功能描述：
     * 如果指定键不存在，则设置值并返回true；否则不做任何操作并返回false。
     * 
     * 设计考量：
     * - 用于实现分布式锁
     * - 原子操作，保证并发安全
     * 
     * @param key     缓存键
     * @param value   缓存值
     * @param timeout 过期时间
     * @param unit    时间单位
     * @return boolean 设置成功返回true，键已存在返回false
     */
    @Override
    public <T> boolean setIfAbsent(String key, T value, long timeout, TimeUnit unit) {
        try {
            return Boolean.TRUE.equals(
                redisTemplate.opsForValue().setIfAbsent(key, value, timeout, unit)
            );
        } catch (Exception e) {
            log.error("Redis setIfAbsent error for key: {}", key, e);
            return false;
        }
    }

    /**
     * 构建缓存键
     * 
     * 功能描述：
     * 根据前缀和多个部分构建完整的缓存键。
     * 
     * 实现逻辑：
     * 1. 以prefix为前缀
     * 2. 用冒号连接各个部分
     * 
     * 设计考量：
     * - 统一的键命名规范，便于管理和查询
     * - 格式：prefix:part1:part2:...
     * 
     * @param prefix 键前缀
     * @param parts  键的各个部分
     * @return String 完整的缓存键
     */
    @Override
    public String buildKey(String prefix, Object... parts) {
        StringBuilder sb = new StringBuilder(prefix);
        for (Object part : parts) {
            sb.append(":").append(part);
        }
        return sb.toString();
    }
}
