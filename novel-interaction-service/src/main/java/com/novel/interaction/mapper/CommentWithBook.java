package com.novel.interaction.mapper;

import lombok.Data;

@Data
public class CommentWithBook {
    private Long id;
    private Long userId;
    private Long bookId;
    private Long parentId;
    private String bookTitle;
    private String userName;
    private String content;
    private Integer likes;
    private String createTime;
    private Boolean isLiked;
}
