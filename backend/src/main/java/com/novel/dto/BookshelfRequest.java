package com.novel.dto;

import jakarta.validation.constraints.NotNull;

public class BookshelfRequest {
    @NotNull(message = "书籍ID不能为空")
    private Long bookId;
    private Long chapterId;

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public Long getChapterId() {
        return chapterId;
    }

    public void setChapterId(Long chapterId) {
        this.chapterId = chapterId;
    }
}