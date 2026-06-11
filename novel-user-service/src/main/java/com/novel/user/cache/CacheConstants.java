package com.novel.user.cache;

import java.util.concurrent.TimeUnit;

public final class CacheConstants {

    private CacheConstants() {}

    public static final String BOOK_DETAIL_PREFIX = "book:detail:";
    public static final String BOOK_LIST_PREFIX = "book:list:";
    public static final String BOOK_CHAPTERS_PREFIX = "book:chapters:";
    public static final String BOOK_SEARCH_PREFIX = "book:search:";

    public static final String CHAPTER_CONTENT_PREFIX = "chapter:content:";

    public static final String USER_INFO_PREFIX = "user:info:";
    public static final String USER_COIN_PREFIX = "user:coin:";

    public static final String RATING_STAT_PREFIX = "rating:stat:";
    public static final String RATING_USER_PREFIX = "rating:user:";

    public static final long BOOK_DETAIL_TTL = 1;
    public static final TimeUnit BOOK_DETAIL_UNIT = TimeUnit.HOURS;

    public static final long CHAPTER_CONTENT_TTL = 30;
    public static final TimeUnit CHAPTER_CONTENT_UNIT = TimeUnit.MINUTES;

    public static final long BOOK_LIST_TTL = 5;
    public static final TimeUnit BOOK_LIST_UNIT = TimeUnit.MINUTES;

    public static final long USER_INFO_TTL = 30;
    public static final TimeUnit USER_INFO_UNIT = TimeUnit.MINUTES;

    public static final long RATING_STAT_TTL = 10;
    public static final TimeUnit RATING_STAT_UNIT = TimeUnit.MINUTES;

    public static final long SEARCH_RESULT_TTL = 5;
    public static final TimeUnit SEARCH_RESULT_UNIT = TimeUnit.MINUTES;

    public static final String NULL_CACHE_VALUE = "NULL";
    public static final long NULL_CACHE_TTL = 5;
    public static final TimeUnit NULL_CACHE_UNIT = TimeUnit.MINUTES;
}
