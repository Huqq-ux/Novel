package com.novel.module.reading.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("bookshelf")
public class BookshelfEntity {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long bookId;
    private Long lastChapterId;
    private LocalDateTime lastReadTime;
    private Double readProgress;
    private LocalDateTime createTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public Long getLastChapterId() { return lastChapterId; }
    public void setLastChapterId(Long lastChapterId) { this.lastChapterId = lastChapterId; }
    public LocalDateTime getLastReadTime() { return lastReadTime; }
    public void setLastReadTime(LocalDateTime lastReadTime) { this.lastReadTime = lastReadTime; }
    public Double getReadProgress() { return readProgress; }
    public void setReadProgress(Double readProgress) { this.readProgress = readProgress; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
