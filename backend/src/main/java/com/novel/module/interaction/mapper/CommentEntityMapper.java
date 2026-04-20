package com.novel.module.interaction.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.interaction.entity.CommentEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface CommentEntityMapper extends BaseMapper<CommentEntity> {

    @Select("SELECT * FROM comments WHERE book_id = #{bookId} AND (parent_id IS NULL OR parent_id = 0) ORDER BY create_time DESC")
    List<CommentEntity> findRootCommentsByBookId(@Param("bookId") Long bookId);

    @Select("SELECT * FROM comments WHERE parent_id = #{parentId} ORDER BY create_time ASC")
    List<CommentEntity> findRepliesByParentId(@Param("parentId") Long parentId);

    @Update("UPDATE comments SET likes = likes + 1 WHERE id = #{commentId}")
    int incrementLikes(@Param("commentId") Long commentId);

    @Update("UPDATE comments SET likes = likes - 1 WHERE id = #{commentId} AND likes > 0")
    int decrementLikes(@Param("commentId") Long commentId);

    @Select("SELECT COUNT(*) FROM comments WHERE book_id = #{bookId}")
    int countByBookId(@Param("bookId") Long bookId);
}
