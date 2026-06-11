package com.novel.user.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
public class CacheServiceImpl implements CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheServiceImpl.class);

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
        } catch (Exception e) {
            log.error("Redis set error for key: {}", key, e);
        }
    }

    @Override
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
        } catch (Exception e) {
            log.error("Redis set with TTL error for key: {}", key, e);
        }
    }

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

    @Override
    public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
        return getOrLoad(key, type, loader, 30, TimeUnit.MINUTES);
    }

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

    @Override
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Redis delete error for key: {}", key, e);
        }
    }

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

    @Override
    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Redis hasKey error for key: {}", key, e);
            return false;
        }
    }

    @Override
    public boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            return Boolean.TRUE.equals(redisTemplate.expire(key, timeout, unit));
        } catch (Exception e) {
            log.error("Redis expire error for key: {}", key, e);
            return false;
        }
    }

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

    @Override
    public void increment(String key) {
        increment(key, 1);
    }

    @Override
    public void increment(String key, long delta) {
        try {
            redisTemplate.opsForValue().increment(key, delta);
        } catch (Exception e) {
            log.error("Redis increment error for key: {}", key, e);
        }
    }

    @Override
    public void decrement(String key) {
        decrement(key, 1);
    }

    @Override
    public void decrement(String key, long delta) {
        try {
            redisTemplate.opsForValue().decrement(key, delta);
        } catch (Exception e) {
            log.error("Redis decrement error for key: {}", key, e);
        }
    }

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

    @Override
    public String buildKey(String prefix, Object... parts) {
        StringBuilder sb = new StringBuilder(prefix);
        for (Object part : parts) {
            sb.append(":").append(part);
        }
        return sb.toString();
    }
}
