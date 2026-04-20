package com.novel.module.event;

public final class ModuleEventTypes {

    private ModuleEventTypes() {}

    public static final String USER_REGISTERED = "user.registered";
    public static final String USER_LOGIN = "user.login";
    public static final String USER_LOGOUT = "user.logout";
    public static final String USER_UPDATED = "user.updated";
    public static final String USER_COIN_CHANGED = "user.coin.changed";

    public static final String BOOK_CREATED = "book.created";
    public static final String BOOK_UPDATED = "book.updated";
    public static final String BOOK_PUBLISHED = "book.published";
    public static final String BOOK_RATING_UPDATED = "book.rating.updated";

    public static final String CHAPTER_CREATED = "chapter.created";
    public static final String CHAPTER_UNLOCKED = "chapter.unlocked";

    public static final String COMMENT_CREATED = "comment.created";
    public static final String COMMENT_LIKED = "comment.liked";
    public static final String RATING_SUBMITTED = "rating.submitted";

    public static final String SIGNIN_COMPLETED = "signin.completed";
    public static final String RECHARGE_COMPLETED = "recharge.completed";

    public static final String NOTIFICATION_CREATED = "notification.created";
}
