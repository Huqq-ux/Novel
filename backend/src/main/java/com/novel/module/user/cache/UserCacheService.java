package com.novel.module.user.cache;

import com.novel.entity.User;
import com.novel.module.common.cache.CacheConstants;
import com.novel.module.common.cache.CacheProtectionService;
import com.novel.module.common.cache.CacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.function.Supplier;

@Service
public class UserCacheService {

    private static final Logger log = LoggerFactory.getLogger(UserCacheService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private CacheProtectionService cacheProtectionService;

    public User getUserById(Long userId, Supplier<User> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.USER_INFO_PREFIX, userId);
        return cacheProtectionService.getWithNullProtection(
            key, User.class, dbLoader,
            CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT, true
        );
    }

    public void cacheUser(User user) {
        if (user != null && user.getId() != null) {
            String key = cacheService.buildKey(CacheConstants.USER_INFO_PREFIX, user.getId());
            cacheProtectionService.setWithRandomExpire(
                key, user,
                CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT
            );
        }
    }

    public void evictUser(Long userId) {
        String key = cacheService.buildKey(CacheConstants.USER_INFO_PREFIX, userId);
        cacheService.delete(key);
        log.debug("Evicted user cache: {}", key);
    }

    public Integer getCoinBalance(Long userId, Supplier<Integer> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        return cacheProtectionService.getWithNullProtection(
            key, Integer.class, dbLoader,
            CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT, false
        );
    }

    public void cacheCoinBalance(Long userId, Integer balance) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        cacheService.set(key, balance, CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT);
    }

    public void evictCoinBalance(Long userId) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        cacheService.delete(key);
        log.debug("Evicted user coin balance cache: {}", key);
    }

    public void evictUserAll(Long userId) {
        evictUser(userId);
        evictCoinBalance(userId);
        log.debug("Evicted all user caches: {}", userId);
    }

    public boolean deductCoins(Long userId, Integer amount, Supplier<Boolean> deductOperation) {
        String lockKey = "coin:deduct:" + userId;
        String lockValue = cacheService.getOrLoad(lockKey, String.class, () -> null);
        
        if (lockValue != null) {
            log.warn("Coin deduction already in progress for user: {}", userId);
            return false;
        }

        boolean acquired = cacheService.setIfAbsent(lockKey, "1", 10, java.util.concurrent.TimeUnit.SECONDS);
        if (!acquired) {
            log.warn("Could not acquire lock for coin deduction: {}", userId);
            return false;
        }

        try {
            boolean success = deductOperation.get();
            if (success) {
                evictCoinBalance(userId);
            }
            return success;
        } finally {
            cacheService.delete(lockKey);
        }
    }

    public void incrementCoinBalance(Long userId, Integer amount) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        cacheService.increment(key, amount);
    }
}
