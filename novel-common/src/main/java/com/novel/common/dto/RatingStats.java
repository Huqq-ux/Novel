package com.novel.common.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 评分统计DTO
 */
@Data
public class RatingStats {
    /**
     * 书籍ID
     */
    private Long bookId;

    /**
     * 平均评分
     */
    private Double averageRating;

    /**
     * 总评分数
     */
    private Integer totalRatings;

    /**
     * 各星级评分数量
     * key: 星级(1-5), value: 数量
     */
    private Map<Integer, Integer> ratingDistribution;

    /**
     * 各星级评分百分比
     * key: 星级(1-5), value: 百分比(0-100)
     */
    private Map<Integer, Double> ratingPercentage;

    public RatingStats() {
    }

    public RatingStats(Long bookId, Double averageRating, Integer totalRatings, 
                       Map<Integer, Integer> ratingDistribution, Map<Integer, Double> ratingPercentage) {
        this.bookId = bookId;
        this.averageRating = averageRating;
        this.totalRatings = totalRatings;
        this.ratingDistribution = ratingDistribution;
        this.ratingPercentage = ratingPercentage;
    }
}
