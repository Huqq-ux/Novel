package com.novel.payment.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class DistributedLock {

    private static final Logger log = LoggerFactory.getLogger(DistributedLock.class);

    private static final String LOCK_PREFIX = "lock:";
    private static final long DEFAULT_EXPIRE_TIME = 30;
    private static final long DEFAULT_RETRY_INTERVAL = 100;

    private static final String UNLOCK_SCRIPT =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "return redis.call('del', KEYS[1]) " +
        "else return 0 end";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public String tryLock(String key) {
        return tryLock(key, DEFAULT_EXPIRE_TIME, TimeUnit.SECONDS);
    }

    public String tryLock(String key, long expireTime, TimeUnit unit) {
        String lockKey = LOCK_PREFIX + key;
        String lockValue = UUID.randomUUID().toString();
        try {
            boolean acquired = Boolean.TRUE.equals(
                redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, expireTime, unit)
            );
            if (acquired) {
                log.debug("Lock acquired: {}", lockKey);
                return lockValue;
            }
            return null;
        } catch (Exception e) {
            log.error("Error acquiring lock: {}", lockKey, e);
            return null;
        }
    }

    public String tryLockWithWait(String key, long waitTime, long expireTime, TimeUnit unit) {
        String lockKey = LOCK_PREFIX + key;
        String lockValue = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();
        long waitMillis = unit.toMillis(waitTime);

        while (System.currentTimeMillis() - startTime < waitMillis) {
            try {
                boolean acquired = Boolean.TRUE.equals(
                    redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, expireTime, unit)
                );
                if (acquired) {
                    log.debug("Lock acquired with wait: {}", lockKey);
                    return lockValue;
                }
                Thread.sleep(DEFAULT_RETRY_INTERVAL);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Lock wait interrupted: {}", lockKey);
                return null;
            } catch (Exception e) {
                log.error("Error acquiring lock with wait: {}", lockKey, e);
                return null;
            }
        }
        log.warn("Lock acquisition timeout: {}", lockKey);
        return null;
    }

    public boolean unlock(String key, String lockValue) {
        String lockKey = LOCK_PREFIX + key;
        try {
            DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(UNLOCK_SCRIPT, Long.class);
            Long result = redisTemplate.execute(
                redisScript,
                Collections.singletonList(lockKey),
                lockValue
            );
            boolean success = result != null && result > 0;
            if (success) {
                log.debug("Lock released: {}", lockKey);
            } else {
                log.warn("Lock release failed (not owner or expired): {}", lockKey);
            }
            return success;
        } catch (Exception e) {
            log.error("Error releasing lock: {}", lockKey, e);
            return false;
        }
    }

    public boolean isLocked(String key) {
        String lockKey = LOCK_PREFIX + key;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(lockKey));
        } catch (Exception e) {
            log.error("Error checking lock status: {}", lockKey, e);
            return false;
        }
    }
}
