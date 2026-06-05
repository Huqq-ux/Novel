package com.novel.dto;

import jakarta.validation.constraints.NotNull;

public class BookmarkRequest {
    @NotNull(message = "书籍ID不能为空")
    private Long bookId;

    @NotNull(message = "章节ID不能为空")
    private Long chapterId;

    private String chapterTitle;
    private Integer position;
    private String note;

    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public Long getChapterId() { return chapterId; }
    public void setChapterId(Long chapterId) { this.chapterId = chapterId; }
    public String getChapterTitle() { return chapterTitle; }
    public void setChapterTitle(String chapterTitle) { this.chapterTitle = chapterTitle; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
