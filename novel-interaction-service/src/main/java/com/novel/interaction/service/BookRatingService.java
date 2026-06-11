package com.novel.interaction.service;

import com.novel.common.dto.RatingStats;
import com.novel.common.entity.BookRating;

import java.util.List;

public interface BookRatingService {

    BookRating submitRating(Long bookId, Long userId, Integer rating);

    BookRating getUserRating(Long bookId, Long userId);

    RatingStats getBookRatingStats(Long bookId);

    List<BookRating> getBookRatings(Long bookId);

    boolean deleteRating(Long bookId, Long userId);
}
