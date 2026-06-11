package com.novel.interaction.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.security.CurrentUser;
import com.novel.interaction.mapper.CommentWithBook;
import com.novel.interaction.service.CommentLikeService;
import com.novel.interaction.service.CommentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/comments")
public class CommentController {

    private static final Logger logger = LoggerFactory.getLogger(CommentController.class);

    @Autowired
    private CommentService commentService;

    @Autowired
    private CommentLikeService commentLikeService;

    @GetMapping("/my")
    public ApiResponse<List<CommentWithBook>> getMyComments(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            List<CommentWithBook> comments = commentService.getUserComments(userId);
            fillLikeStatus(userId, comments);
            return ApiResponse.success(comments);
        } catch (Exception e) {
            logger.error("Failed to get user comments: {}", e.getMessage());
            return ApiResponse.error(500, "获取评论列表失败");
        }
    }

    @GetMapping("/book/{bookId}")
    public ApiResponse<List<CommentWithBook>> getBookComments(
            @PathVariable Long bookId,
            @CurrentUser(required = false) Long userId) {
        try {
            List<CommentWithBook> comments = commentService.getBookComments(bookId);
            fillLikeStatus(userId, comments);
            return ApiResponse.success(comments);
        } catch (Exception e) {
            logger.error("Failed to get book comments: {}", e.getMessage());
            return ApiResponse.error(500, "获取评论列表失败");
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteComment(@CurrentUser Long userId, @PathVariable Long id) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            boolean deleted = commentService.deleteComment(userId, id);
            if (deleted) {
                return ApiResponse.success(null);
            } else {
                return ApiResponse.error(404, "评论不存在或无权删除");
            }
        } catch (Exception e) {
            logger.error("Failed to delete comment: {}", e.getMessage());
            return ApiResponse.error(500, "删除评论失败");
        }
    }

    @PostMapping("/add")
    public ApiResponse<Void> addComment(@CurrentUser Long userId, @RequestBody CommentRequest request) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            return ApiResponse.error(400, "评论内容不能为空");
        }
        if (request.getContent().length() > 500) {
            return ApiResponse.error(400, "评论内容不能超过500字");
        }
        try {
            boolean added = commentService.addComment(userId, request.getBookId(), request.getContent(), request.getParentId());
            if (added) {
                return ApiResponse.success(null);
            } else {
                return ApiResponse.error(500, "添加评论失败");
            }
        } catch (Exception e) {
            logger.error("Failed to add comment: {}", e.getMessage());
            return ApiResponse.error(500, "添加评论失败");
        }
    }

    @PostMapping("/{id}/like")
    public ApiResponse<LikeResponse> toggleLike(@CurrentUser Long userId, @PathVariable Long id) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            boolean isLiked = commentLikeService.toggleLike(userId, id);
            int likeCount = commentLikeService.getLikeCount(id);
            return ApiResponse.success(new LikeResponse(isLiked, likeCount));
        } catch (Exception e) {
            logger.error("Failed to toggle like: {}", e.getMessage(), e);
            return ApiResponse.error(500, "操作失败: " + e.getMessage());
        }
    }

    private void fillLikeStatus(Long userId, List<CommentWithBook> comments) {
        if (userId == null || comments.isEmpty()) {
            for (CommentWithBook comment : comments) {
                comment.setIsLiked(false);
            }
            return;
        }
        List<Long> commentIds = new ArrayList<>();
        for (CommentWithBook comment : comments) {
            commentIds.add(comment.getId());
        }
        Set<Long> likedIds = commentLikeService.batchGetLikedCommentIds(userId, commentIds);
        for (CommentWithBook comment : comments) {
            comment.setIsLiked(likedIds.contains(comment.getId()));
        }
    }

    public static class CommentRequest {
        private Long bookId;
        private Long parentId;
        private String content;

        public Long getBookId() { return bookId; }
        public void setBookId(Long bookId) { this.bookId = bookId; }
        public Long getParentId() { return parentId; }
        public void setParentId(Long parentId) { this.parentId = parentId; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public static class LikeResponse {
        private boolean isLiked;
        private int likeCount;

        public LikeResponse(boolean isLiked, int likeCount) {
            this.isLiked = isLiked;
            this.likeCount = likeCount;
        }

        public boolean getIsLiked() { return isLiked; }
        public void setIsLiked(boolean isLiked) { this.isLiked = isLiked; }
        public int getLikeCount() { return likeCount; }
        public void setLikeCount(int likeCount) { this.likeCount = likeCount; }
    }
}
