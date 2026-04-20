package com.novel.service;

import com.novel.entity.BookRating;
import com.novel.dto.RatingStats;

import java.util.List;
import java.util.Map;

/**
 * 书籍评分服务接口
 */
public interface BookRatingService {
    
    /**
     * 提交或更新评分
     */
    BookRating submitRating(Long bookId, Long userId, Integer rating);
    
    /**
     * 获取用户对书籍的评分
     */
    BookRating getUserRating(Long bookId, Long userId);
    
    /**
     * 获取书籍的评分统计
     */
    RatingStats getBookRatingStats(Long bookId);
    
    /**
     * 获取书籍的所有评分
     */
    List<BookRating> getBookRatings(Long bookId);
    
    /**
     * 删除评分
     */
    boolean deleteRating(Long bookId, Long userId);
}
