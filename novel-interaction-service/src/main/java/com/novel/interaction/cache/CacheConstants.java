package com.novel.interaction.cache;

import java.util.concurrent.TimeUnit;

public final class CacheConstants {

    private CacheConstants() {}

    public static final String COMMENT_LIST_PREFIX = "comment:list:";
    public static final String COMMENT_LIKE_PREFIX = "comment:like:";

    public static final String RATING_STAT_PREFIX = "rating:stat:";
    public static final String RATING_USER_PREFIX = "rating:user:";

    public static final String TIP_LIST_PREFIX = "tip:list:";

    public static final String BOOK_LIST_PREFIX = "booklist:detail:";
    public static final String BOOK_LIST_ITEMS_PREFIX = "booklist:items:";

    public static final String USER_INFO_PREFIX = "user:info:";
    public static final String USER_COIN_PREFIX = "user:coin:";

    public static final long COMMENT_LIST_TTL = 5;
    public static final TimeUnit COMMENT_LIST_UNIT = TimeUnit.MINUTES;

    public static final long RATING_STAT_TTL = 10;
    public static final TimeUnit RATING_STAT_UNIT = TimeUnit.MINUTES;

    public static final long TIP_LIST_TTL = 5;
    public static final TimeUnit TIP_LIST_UNIT = TimeUnit.MINUTES;

    public static final long BOOK_LIST_TTL = 5;
    public static final TimeUnit BOOK_LIST_UNIT = TimeUnit.MINUTES;

    public static final long USER_INFO_TTL = 30;
    public static final TimeUnit USER_INFO_UNIT = TimeUnit.MINUTES;

    public static final String NULL_CACHE_VALUE = "NULL";
    public static final long NULL_CACHE_TTL = 5;
    public static final TimeUnit NULL_CACHE_UNIT = TimeUnit.MINUTES;
}
