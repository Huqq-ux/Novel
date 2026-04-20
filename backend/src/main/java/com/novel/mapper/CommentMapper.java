package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 评论数据访问接口
 * 
 * 提供评论实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 包含基本的CRUD操作和评论相关的自定义查询方法。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 使用@Select注解直接定义SQL，简化开发
 * 3. 关联查询书籍和用户信息，减少多次查询
 * 4. 返回CommentWithBook包含关联信息
 */
@Mapper
public interface CommentMapper extends BaseMapper<Comment> {

    /**
     * 查询用户的评论列表（含书籍信息）
     * 
     * 功能描述：
     * 查询指定用户发表的所有评论，关联查询书籍标题。
     * 
     * 实现逻辑：
     * 1. 查询用户的所有评论记录
     * 2. LEFT JOIN书籍表获取书籍标题
     * 3. 按创建时间倒序排列
     * 
     * 设计考量：
     * - 使用LEFT JOIN确保即使书籍被删除也能显示评论
     * - 返回CommentWithBook包含书籍标题
     * - 用于用户个人中心的评论管理
     * 
     * @param userId 用户ID
     * @return List<CommentWithBook> 评论列表（含书籍标题）
     */
    @Select("SELECT c.*, b.title as book_title FROM comments c " +
            "LEFT JOIN books b ON c.book_id = b.id " +
            "WHERE c.user_id = #{userId} " +
            "ORDER BY c.create_time DESC")
    List<CommentWithBook> selectByUserId(Long userId);

    /**
     * 查询书籍的评论列表（含用户信息）
     * 
     * 功能描述：
     * 查询指定书籍的所有评论，关联查询书籍标题和用户名。
     * 
     * 实现逻辑：
     * 1. 查询书籍的所有评论记录
     * 2. LEFT JOIN书籍表获取书籍标题
     * 3. LEFT JOIN用户表获取用户名
     * 4. 按创建时间倒序排列
     * 
     * 设计考量：
     * - 使用LEFT JOIN确保数据完整性
     * - 返回CommentWithBook包含书籍标题和用户名
     * - 用于书籍详情页的评论展示
     * 
     * @param bookId 书籍ID
     * @return List<CommentWithBook> 评论列表（含书籍标题和用户名）
     */
    @Select("SELECT c.*, b.title as book_title, u.username as user_name FROM comments c " +
            "LEFT JOIN books b ON c.book_id = b.id " +
            "LEFT JOIN users u ON c.user_id = u.id " +
            "WHERE c.book_id = #{bookId} " +
            "ORDER BY c.create_time DESC")
    List<CommentWithBook> selectByBookId(Long bookId);
}
