package com.novel.module.interaction.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.interaction.entity.RatingEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface RatingEntityMapper extends BaseMapper<RatingEntity> {

    @Select("SELECT * FROM book_ratings WHERE book_id = #{bookId} AND user_id = #{userId}")
    RatingEntity findByBookIdAndUserId(@Param("bookId") Long bookId, @Param("userId") Long userId);

    @Select("SELECT AVG(rating) FROM book_ratings WHERE book_id = #{bookId}")
    Double selectAvgRatingByBookId(@Param("bookId") Long bookId);

    @Select("SELECT COUNT(*) FROM book_ratings WHERE book_id = #{bookId}")
    Integer selectCountByBookId(@Param("bookId") Long bookId);

    @Select("SELECT rating, COUNT(*) as count FROM book_ratings WHERE book_id = #{bookId} GROUP BY rating ORDER BY rating DESC")
    List<Map<String, Object>> selectRatingDistributionByBookId(@Param("bookId") Long bookId);
}
