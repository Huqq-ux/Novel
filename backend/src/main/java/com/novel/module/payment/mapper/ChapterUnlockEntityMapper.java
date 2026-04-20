package com.novel.module.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.payment.entity.ChapterUnlockEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ChapterUnlockEntityMapper extends BaseMapper<ChapterUnlockEntity> {

    @Select("SELECT * FROM chapter_unlocks WHERE user_id = #{userId} AND chapter_id = #{chapterId}")
    Optional<ChapterUnlockEntity> findByUserIdAndChapterId(@Param("userId") Long userId, @Param("chapterId") Long chapterId);

    @Select("SELECT * FROM chapter_unlocks WHERE user_id = #{userId} AND book_id = #{bookId}")
    List<ChapterUnlockEntity> findByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);

    @Select("SELECT COUNT(*) FROM chapter_unlocks WHERE user_id = #{userId}")
    int countByUserId(@Param("userId") Long userId);
}
