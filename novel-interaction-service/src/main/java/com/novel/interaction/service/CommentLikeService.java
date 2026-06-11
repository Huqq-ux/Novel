package com.novel.interaction.service;

import java.util.List;
import java.util.Set;

public interface CommentLikeService {
    boolean toggleLike(Long userId, Long commentId);
    boolean isLiked(Long userId, Long commentId);
    int getLikeCount(Long commentId);
    Set<Long> batchGetLikedCommentIds(Long userId, List<Long> commentIds);
}
