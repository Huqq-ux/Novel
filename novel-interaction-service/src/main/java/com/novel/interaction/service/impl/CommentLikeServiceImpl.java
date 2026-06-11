package com.novel.interaction.service.impl;

import com.novel.common.entity.Comment;
import com.novel.common.entity.CommentLike;
import com.novel.interaction.mapper.CommentLikeMapper;
import com.novel.interaction.mapper.CommentMapper;
import com.novel.interaction.service.CommentLikeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class CommentLikeServiceImpl implements CommentLikeService {

    private static final Logger logger = LoggerFactory.getLogger(CommentLikeServiceImpl.class);

    @Autowired
    private CommentLikeMapper commentLikeMapper;

    @Autowired
    private CommentMapper commentMapper;

    @Override
    @Transactional
    public boolean toggleLike(Long userId, Long commentId) {
        logger.info("Toggling like: userId={}, commentId={}", userId, commentId);

        Comment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            logger.warn("Comment not found: {}", commentId);
            return false;
        }

        int currentLikes = comment.getLikes() != null ? comment.getLikes() : 0;
        boolean alreadyLiked = commentLikeMapper.existsByUserIdAndCommentId(userId, commentId);

        if (alreadyLiked) {
            commentLikeMapper.deleteByUserIdAndCommentId(userId, commentId);
            comment.setLikes(Math.max(0, currentLikes - 1));
            logger.info("Unliked comment: commentId={}, new likes={}", commentId, comment.getLikes());
        } else {
            CommentLike like = new CommentLike();
            like.setUserId(userId);
            like.setCommentId(commentId);
            like.setCreateTime(LocalDateTime.now());
            commentLikeMapper.insert(like);
            comment.setLikes(currentLikes + 1);
            logger.info("Liked comment: commentId={}, new likes={}", commentId, comment.getLikes());
        }

        commentMapper.updateById(comment);
        return !alreadyLiked;
    }

    @Override
    public boolean isLiked(Long userId, Long commentId) {
        if (userId == null) {
            return false;
        }
        return commentLikeMapper.existsByUserIdAndCommentId(userId, commentId);
    }

    @Override
    public int getLikeCount(Long commentId) {
        return commentLikeMapper.countByCommentId(commentId);
    }

    @Override
    public Set<Long> batchGetLikedCommentIds(Long userId, List<Long> commentIds) {
        if (userId == null || commentIds == null || commentIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Long> likedIds = commentLikeMapper.findLikedCommentIds(userId, commentIds);
        return new HashSet<>(likedIds);
    }
}
