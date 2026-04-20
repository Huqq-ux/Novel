package com.novel.service.impl;

import com.novel.entity.Comment;
import com.novel.mapper.CommentMapper;
import com.novel.mapper.CommentWithBook;
import com.novel.service.CommentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 评论服务实现类
 * 
 * 提供书籍评论相关的核心业务逻辑，包括评论发布、查询、删除等功能。
 * 支持评论嵌套回复，实现用户互动功能。
 * 
 * 设计考量：
 * 1. 评论与书籍和用户关联，支持多维度查询
 * 2. 评论删除仅限作者本人，保障内容安全
 * 3. 评论内容长度限制，防止恶意刷屏
 * 4. 使用DTO返回关联信息，避免N+1查询
 */
@Service
public class CommentServiceImpl implements CommentService {

    private static final Logger logger = LoggerFactory.getLogger(CommentServiceImpl.class);

    @Autowired
    private CommentMapper commentMapper;

    /**
     * 获取用户发表的评论列表
     * 
     * 功能描述：
     * 查询指定用户发表的所有评论，包含关联的书籍信息。
     * 
     * 实现逻辑：
     * 1. 根据用户ID查询评论记录
     * 2. 关联查询书籍基本信息
     * 3. 按评论时间倒序排列
     * 
     * 设计考量：
     * - 返回评论及关联书籍信息，便于用户管理
     * - 使用LEFT JOIN关联书籍信息，避免N+1查询
     * - 按评论时间倒序排列，最新评论在前
     * 
     * @param userId 用户ID
     * @return List<CommentWithBook> 用户评论列表，包含书籍信息
     */
    @Override
    public List<CommentWithBook> getUserComments(Long userId) {
        return commentMapper.selectByUserId(userId);
    }

    /**
     * 获取书籍评论列表
     * 
     * 功能描述：
     * 查询指定书籍的所有评论，包含用户信息。
     * 
     * 实现逻辑：
     * 1. 根据书籍ID查询评论列表
     * 2. 关联查询用户昵称和头像
     * 3. 按评论时间倒序排列
     * 
     * 设计考量：
     * - 使用LEFT JOIN关联用户信息，避免N+1查询
     * - 评论按时间倒序排列，最新评论在前
     * - 点赞数量实时统计，不缓存
     * - 记录日志便于问题排查
     * 
     * @param bookId 书籍ID
     * @return List<CommentWithBook> 书籍评论列表，包含用户信息
     */
    @Override
    public List<CommentWithBook> getBookComments(Long bookId) {
        logger.info("Getting comments for bookId: {}", bookId);
        List<CommentWithBook> comments = commentMapper.selectByBookId(bookId);
        logger.info("Found {} comments for bookId: {}", comments.size(), bookId);
        return comments;
    }

    /**
     * 删除评论
     * 
     * 功能描述：
     * 删除指定评论，仅限评论作者本人操作。
     * 
     * 实现逻辑：
     * 1. 查询评论记录
     * 2. 校验评论归属权
     * 3. 执行删除操作
     * 
     * 设计考量：
     * - 权限校验确保用户只能删除自己的评论
     * - 评论不存在或无权删除返回false
     * - 返回boolean而非抛出异常，便于Controller统一处理
     * - 管理员删除功能暂未实现
     * 
     * @param userId    用户ID
     * @param commentId 评论ID
     * @return boolean 删除成功返回true，无权限或不存在返回false
     */
    @Override
    public boolean deleteComment(Long userId, Long commentId) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null || !comment.getUserId().equals(userId)) {
            return false;
        }
        return commentMapper.deleteById(commentId) > 0;
    }

    /**
     * 发表评论（无父评论）
     * 
     * 功能描述：
     * 为指定书籍发表顶级评论。
     * 
     * 实现逻辑：
     * 1. 创建评论对象
     * 2. 设置评论属性
     * 3. 持久化到数据库
     * 
     * @param userId  用户ID
     * @param bookId  书籍ID
     * @param content 评论内容
     * @return boolean 发表成功返回true
     */
    @Override
    public boolean addComment(Long userId, Long bookId, String content) {
        return addComment(userId, bookId, content, null);
    }

    /**
     * 发表评论（支持回复）
     * 
     * 功能描述：
     * 为指定书籍发表评论或回复他人评论。
     * 
     * 实现逻辑：
     * 1. 创建评论对象并设置属性
     * 2. 设置创建时间和更新时间
     * 3. 持久化到数据库
     * 
     * 设计考量：
     * - 支持嵌套回复，parentId为null表示顶级评论
     * - 评论内容长度校验在Controller层完成
     * - 点赞数初始为0
     * - 记录日志便于问题排查
     * - 返回boolean而非抛出异常，便于Controller处理
     * 
     * @param userId   用户ID
     * @param bookId   书籍ID
     * @param content  评论内容
     * @param parentId 父评论ID，为null表示顶级评论
     * @return boolean 发表成功返回true
     */
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
