package com.novel.interaction.service.impl;

import com.novel.common.dto.RatingStats;
import com.novel.common.entity.BookRating;
import com.novel.interaction.mapper.BookRatingMapper;
import com.novel.interaction.service.BookRatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BookRatingServiceImpl implements BookRatingService {

    @Autowired
    private BookRatingMapper bookRatingMapper;

    @Override
    @Transactional
    public BookRating submitRating(Long bookId, Long userId, Integer rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("评分必须在1-5之间");
        }

        BookRating existingRating = bookRatingMapper.selectByBookIdAndUserId(bookId, userId);

        if (existingRating != null) {
            existingRating.setRating(rating);
            existingRating.setUpdateTime(LocalDateTime.now());
            bookRatingMapper.updateById(existingRating);
            return existingRating;
        } else {
            BookRating newRating = new BookRating();
            newRating.setBookId(bookId);
            newRating.setUserId(userId);
            newRating.setRating(rating);
            newRating.setCreateTime(LocalDateTime.now());
            newRating.setUpdateTime(LocalDateTime.now());
            bookRatingMapper.insert(newRating);
            return newRating;
        }
    }

    @Override
    public BookRating getUserRating(Long bookId, Long userId) {
        return bookRatingMapper.selectByBookIdAndUserId(bookId, userId);
    }

    @Override
    public RatingStats getBookRatingStats(Long bookId) {
        Double avgRating = bookRatingMapper.selectAvgRatingByBookId(bookId);
        Integer totalRatings = bookRatingMapper.selectCountByBookId(bookId);
        List<Map<String, Object>> distribution = bookRatingMapper.selectRatingDistributionByBookId(bookId);

        Map<Integer, Integer> ratingDistribution = new HashMap<>();
        Map<Integer, Double> ratingPercentage = new HashMap<>();

        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0);
            ratingPercentage.put(i, 0.0);
        }

        for (Map<String, Object> item : distribution) {
            Integer rating = (Integer) item.get("rating");
            Long count = (Long) item.get("count");
            ratingDistribution.put(rating, count.intValue());
            if (totalRatings > 0) {
                ratingPercentage.put(rating, (count.doubleValue() / totalRatings) * 100);
            }
        }

        return new RatingStats(
            bookId,
            avgRating != null ? Math.round(avgRating * 10) / 10.0 : 0.0,
            totalRatings != null ? totalRatings : 0,
            ratingDistribution,
            ratingPercentage
        );
    }

    @Override
    public List<BookRating> getBookRatings(Long bookId) {
        return bookRatingMapper.selectByBookId(bookId);
    }

    @Override
    @Transactional
    public boolean deleteRating(Long bookId, Long userId) {
        BookRating rating = bookRatingMapper.selectByBookIdAndUserId(bookId, userId);
        if (rating != null) {
            return bookRatingMapper.deleteById(rating.getId()) > 0;
        }
        return false;
    }
}
