package com.novel.interaction.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {

    @Select("SELECT c.*, b.title as book_title FROM comments c " +
            "LEFT JOIN books b ON c.book_id = b.id " +
            "WHERE c.user_id = #{userId} " +
            "ORDER BY c.create_time DESC")
    List<CommentWithBook> selectByUserId(Long userId);

    @Select("SELECT c.*, b.title as book_title, u.username as user_name FROM comments c " +
            "LEFT JOIN books b ON c.book_id = b.id " +
            "LEFT JOIN users u ON c.user_id = u.id " +
            "WHERE c.book_id = #{bookId} " +
            "ORDER BY c.create_time DESC")
    List<CommentWithBook> selectByBookId(Long bookId);
}
