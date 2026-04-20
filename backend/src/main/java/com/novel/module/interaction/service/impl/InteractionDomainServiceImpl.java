package com.novel.module.interaction.service.impl;

import com.novel.module.interaction.entity.CommentEntity;
import com.novel.module.interaction.entity.RatingEntity;
import com.novel.module.interaction.mapper.CommentEntityMapper;
import com.novel.module.interaction.mapper.RatingEntityMapper;
import com.novel.module.interaction.service.InteractionDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InteractionDomainServiceImpl implements InteractionDomainService {

    @Autowired
    private CommentEntityMapper commentMapper;

    @Autowired
    private RatingEntityMapper ratingMapper;

    @Override
    @Transactional
    public CommentEntity createComment(Long userId, Long bookId, Long parentId, String content) {
        CommentEntity comment = new CommentEntity();
        comment.setUserId(userId);
        comment.setBookId(bookId);
        comment.setParentId(parentId);
        comment.setContent(content);
        comment.setLikes(0);
        comment.setCreateTime(LocalDateTime.now());
        comment.setUpdateTime(LocalDateTime.now());
        commentMapper.insert(comment);
        return comment;
    }

    @Override
    public List<CommentEntity> getCommentsByBookId(Long bookId) {
        return commentMapper.findRootCommentsByBookId(bookId);
    }

    @Override
    public List<CommentEntity> getRepliesByParentId(Long parentId) {
        return commentMapper.findRepliesByParentId(parentId);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        commentMapper.deleteById(commentId);
    }

    @Override
    @Transactional
    public void incrementCommentLikes(Long commentId) {
        commentMapper.incrementLikes(commentId);
    }

    @Override
    @Transactional
    public void decrementCommentLikes(Long commentId) {
        commentMapper.decrementLikes(commentId);
    }

    @Override
    @Transactional
    public RatingEntity submitRating(Long bookId, Long userId, Integer rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("评分必须在1-5之间");
        }

        RatingEntity existingRating = ratingMapper.findByBookIdAndUserId(bookId, userId);
        
        if (existingRating != null) {
            existingRating.setRating(rating);
            existingRating.setUpdateTime(LocalDateTime.now());
            ratingMapper.updateById(existingRating);
            return existingRating;
        } else {
            RatingEntity newRating = new RatingEntity();
            newRating.setBookId(bookId);
            newRating.setUserId(userId);
            newRating.setRating(rating);
            newRating.setCreateTime(LocalDateTime.now());
            newRating.setUpdateTime(LocalDateTime.now());
            ratingMapper.insert(newRating);
            return newRating;
        }
    }

    @Override
    public Optional<RatingEntity> getUserRating(Long bookId, Long userId) {
        return Optional.ofNullable(ratingMapper.findByBookIdAndUserId(bookId, userId));
    }

    @Override
    public Double getAverageRating(Long bookId) {
        Double avg = ratingMapper.selectAvgRatingByBookId(bookId);
        return avg != null ? Math.round(avg * 10) / 10.0 : 0.0;
    }

    @Override
    public Integer getRatingCount(Long bookId) {
        Integer count = ratingMapper.selectCountByBookId(bookId);
        return count != null ? count : 0;
    }

    @Override
    public Map<Integer, Integer> getRatingDistribution(Long bookId) {
        List<Map<String, Object>> distribution = ratingMapper.selectRatingDistributionByBookId(bookId);
        Map<Integer, Integer> result = new HashMap<>();
        
        for (int i = 1; i <= 5; i++) {
            result.put(i, 0);
        }
        
        for (Map<String, Object> item : distribution) {
            Integer rating = (Integer) item.get("rating");
            Long count = (Long) item.get("count");
            result.put(rating, count.intValue());
        }
        
        return result;
    }
}
