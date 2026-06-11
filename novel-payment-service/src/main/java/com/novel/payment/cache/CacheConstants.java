package com.novel.payment.cache;

import java.util.concurrent.TimeUnit;

public final class CacheConstants {

    private CacheConstants() {}

    public static final String USER_COIN_PREFIX = "user:coin:";
    public static final String SIGN_IN_STATUS_PREFIX = "signin:status:";
    public static final String PACKAGE_LIST_KEY = "payment:packages";
    public static final String RECHARGE_RECORD_PREFIX = "payment:records:";

    public static final long PACKAGE_LIST_TTL = 10;
    public static final TimeUnit PACKAGE_LIST_UNIT = TimeUnit.MINUTES;

    public static final long USER_COIN_TTL = 5;
    public static final TimeUnit USER_COIN_UNIT = TimeUnit.MINUTES;

    public static final long SIGN_IN_STATUS_TTL = 5;
    public static final TimeUnit SIGN_IN_STATUS_UNIT = TimeUnit.MINUTES;

    public static final long RECHARGE_RECORD_TTL = 5;
    public static final TimeUnit RECHARGE_RECORD_UNIT = TimeUnit.MINUTES;

    public static final String NULL_CACHE_VALUE = "NULL";
    public static final long NULL_CACHE_TTL = 5;
    public static final TimeUnit NULL_CACHE_UNIT = TimeUnit.MINUTES;
}
