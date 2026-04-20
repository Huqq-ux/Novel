package com.novel.module.spi;

import java.util.List;
import java.util.Optional;

public interface ContentServiceFacade {

    boolean existsBookById(Long bookId);
    
    Optional<BookInfo> getBookInfo(Long bookId);
    
    Optional<ChapterInfo> getChapterInfo(Long chapterId);
    
    List<ChapterInfo> getChaptersByBookId(Long bookId);
    
    boolean isChapterFree(Long bookId, Long chapterId);
    
    Integer getChapterPrice(Long bookId, Long chapterId);
    
    void updateBookRating(Long bookId, Double rating);

    class BookInfo {
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
        private Integer priceType;
        private Long authorId;
        private Integer freeChapterCount;
        private Integer totalWords;

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
        public Integer getPriceType() { return priceType; }
        public void setPriceType(Integer priceType) { this.priceType = priceType; }
        public Long getAuthorId() { return authorId; }
        public void setAuthorId(Long authorId) { this.authorId = authorId; }
        public Integer getFreeChapterCount() { return freeChapterCount; }
        public void setFreeChapterCount(Integer freeChapterCount) { this.freeChapterCount = freeChapterCount; }
        public Integer getTotalWords() { return totalWords; }
        public void setTotalWords(Integer totalWords) { this.totalWords = totalWords; }
    }

    class ChapterInfo {
        private Long id;
        private Long bookId;
        private String title;
        private String content;
        private Integer wordCount;
        private Integer orderNum;
        private Integer isFree;
        private Integer price;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getBookId() { return bookId; }
        public void setBookId(Long bookId) { this.bookId = bookId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Integer getWordCount() { return wordCount; }
        public void setWordCount(Integer wordCount) { this.wordCount = wordCount; }
        public Integer getOrderNum() { return orderNum; }
        public void setOrderNum(Integer orderNum) { this.orderNum = orderNum; }
        public Integer getIsFree() { return isFree; }
        public void setIsFree(Integer isFree) { this.isFree = isFree; }
        public Integer getPrice() { return price; }
        public void setPrice(Integer price) { this.price = price; }
    }
}
