package com.novel.module.interaction.service;

import com.novel.module.interaction.entity.CommentEntity;
import com.novel.module.interaction.entity.RatingEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface InteractionDomainService {

    CommentEntity createComment(Long userId, Long bookId, Long parentId, String content);
    
    List<CommentEntity> getCommentsByBookId(Long bookId);
    
    List<CommentEntity> getRepliesByParentId(Long parentId);
    
    void deleteComment(Long commentId);
    
    void incrementCommentLikes(Long commentId);
    
    void decrementCommentLikes(Long commentId);
    
    RatingEntity submitRating(Long bookId, Long userId, Integer rating);
    
    Optional<RatingEntity> getUserRating(Long bookId, Long userId);
    
    Double getAverageRating(Long bookId);
    
    Integer getRatingCount(Long bookId);
    
    Map<Integer, Integer> getRatingDistribution(Long bookId);
}
