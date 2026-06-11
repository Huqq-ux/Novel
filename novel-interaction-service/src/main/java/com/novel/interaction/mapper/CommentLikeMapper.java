package com.novel.interaction.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.CommentLike;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CommentLikeMapper extends BaseMapper<CommentLike> {

    @Select("SELECT COUNT(*) > 0 FROM comment_likes WHERE user_id = #{userId} AND comment_id = #{commentId}")
    boolean existsByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);

    @Select("SELECT COUNT(*) FROM comment_likes WHERE comment_id = #{commentId}")
    int countByCommentId(@Param("commentId") Long commentId);

    @Delete("DELETE FROM comment_likes WHERE user_id = #{userId} AND comment_id = #{commentId}")
    int deleteByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);

    @Select("<script>" +
            "SELECT comment_id FROM comment_likes WHERE user_id = #{userId} AND comment_id IN " +
            "<foreach collection='commentIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    List<Long> findLikedCommentIds(@Param("userId") Long userId, @Param("commentIds") List<Long> commentIds);
}
