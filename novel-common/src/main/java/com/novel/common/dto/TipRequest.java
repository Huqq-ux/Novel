package com.novel.common.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class TipRequest {
    @NotNull(message = "作者ID不能为空")
    private Long authorId;

    @NotNull(message = "书籍ID不能为空")
    private Long bookId;

    private Long chapterId;

    @NotNull(message = "打赏金额不能为空")
    @Min(value = 1, message = "打赏金额至少1书币")
    private Integer amount;

    private String message;

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }
    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public Long getChapterId() { return chapterId; }
    public void setChapterId(Long chapterId) { this.chapterId = chapterId; }
    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
