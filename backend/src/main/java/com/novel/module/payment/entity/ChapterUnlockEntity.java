package com.novel.module.payment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("chapter_unlocks")
public class ChapterUnlockEntity {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long bookId;
    private Long chapterId;
    private Integer coinsPaid;
    private LocalDateTime unlockTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public Long getChapterId() { return chapterId; }
    public void setChapterId(Long chapterId) { this.chapterId = chapterId; }
    public Integer getCoinsPaid() { return coinsPaid; }
    public void setCoinsPaid(Integer coinsPaid) { this.coinsPaid = coinsPaid; }
    public LocalDateTime getUnlockTime() { return unlockTime; }
    public void setUnlockTime(LocalDateTime unlockTime) { this.unlockTime = unlockTime; }
}
