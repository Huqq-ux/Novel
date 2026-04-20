package com.novel.service;

import com.novel.mapper.CommentWithBook;

import java.util.List;

public interface CommentService {
    List<CommentWithBook> getUserComments(Long userId);
    List<CommentWithBook> getBookComments(Long bookId);
    boolean deleteComment(Long userId, Long commentId);
    boolean addComment(Long userId, Long bookId, String content);
    boolean addComment(Long userId, Long bookId, String content, Long parentId);
}
