package com.novel.module.content.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("books")
public class BookEntity {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String author;
    private String cover;
    private String category;
    private String description;
    private Integer chapterCount;
    private Boolean isFinished;
    private Double rating;
    private Integer clickCount;
    private Integer collectCount;
    private Integer status;
    private Integer priceType;
    private Long authorId;
    private Integer freeChapterCount;
    private Integer totalWords;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String latestChapterName;
    private LocalDateTime latestChapterUpdateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getCover() { return cover; }
    public void setCover(String cover) { this.cover = cover; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getChapterCount() { return chapterCount; }
    public void setChapterCount(Integer chapterCount) { this.chapterCount = chapterCount; }
    public Boolean getIsFinished() { return isFinished; }
    public void setIsFinished(Boolean isFinished) { this.isFinished = isFinished; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getClickCount() { return clickCount; }
    public void setClickCount(Integer clickCount) { this.clickCount = clickCount; }
    public Integer getCollectCount() { return collectCount; }
    public void setCollectCount(Integer collectCount) { this.collectCount = collectCount; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Integer getPriceType() { return priceType; }
    public void setPriceType(Integer priceType) { this.priceType = priceType; }
    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }
    public Integer getFreeChapterCount() { return freeChapterCount; }
    public void setFreeChapterCount(Integer freeChapterCount) { this.freeChapterCount = freeChapterCount; }
    public Integer getTotalWords() { return totalWords; }
    public void setTotalWords(Integer totalWords) { this.totalWords = totalWords; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
    public String getLatestChapterName() { return latestChapterName; }
    public void setLatestChapterName(String latestChapterName) { this.latestChapterName = latestChapterName; }
    public LocalDateTime getLatestChapterUpdateTime() { return latestChapterUpdateTime; }
    public void setLatestChapterUpdateTime(LocalDateTime latestChapterUpdateTime) { this.latestChapterUpdateTime = latestChapterUpdateTime; }
}
