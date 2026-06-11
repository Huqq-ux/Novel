package com.novel.interaction.service.impl;

import com.novel.common.entity.Comment;
import com.novel.interaction.mapper.CommentMapper;
import com.novel.interaction.mapper.CommentWithBook;
import com.novel.interaction.service.CommentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentServiceImpl implements CommentService {

    private static final Logger logger = LoggerFactory.getLogger(CommentServiceImpl.class);

    @Autowired
    private CommentMapper commentMapper;

    @Override
    public List<CommentWithBook> getUserComments(Long userId) {
        return commentMapper.selectByUserId(userId);
    }

    @Override
    public List<CommentWithBook> getBookComments(Long bookId) {
        logger.info("Getting comments for bookId: {}", bookId);
        List<CommentWithBook> comments = commentMapper.selectByBookId(bookId);
        logger.info("Found {} comments for bookId: {}", comments.size(), bookId);
        return comments;
    }

    @Override
    public boolean deleteComment(Long userId, Long commentId) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null || !comment.getUserId().equals(userId)) {
            return false;
        }
        return commentMapper.deleteById(commentId) > 0;
    }

    @Override
    public boolean addComment(Long userId, Long bookId, String content) {
        return addComment(userId, bookId, content, null);
    }

    @Override
    public boolean addComment(Long userId, Long bookId, String content, Long parentId) {
        logger.info("Adding comment: userId={}, bookId={}, parentId={}, content={}", userId, bookId, parentId, content);
        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setBookId(bookId);
        comment.setParentId(parentId);
        comment.setContent(content);
        comment.setLikes(0);
        comment.setCreateTime(LocalDateTime.now());
        comment.setUpdateTime(LocalDateTime.now());
        try {
            int result = commentMapper.insert(comment);
            logger.info("Insert result: {}, generated id: {}", result, comment.getId());
            return result > 0;
        } catch (Exception e) {
            logger.error("Failed to insert comment: {}", e.getMessage(), e);
            return false;
        }
    }
}
