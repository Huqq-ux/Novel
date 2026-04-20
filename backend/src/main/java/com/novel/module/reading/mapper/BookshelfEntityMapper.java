package com.novel.module.reading.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.reading.entity.BookshelfEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface BookshelfEntityMapper extends BaseMapper<BookshelfEntity> {

    @Select("SELECT * FROM bookshelf WHERE user_id = #{userId} AND book_id = #{bookId}")
    Optional<BookshelfEntity> findByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);

    @Select("SELECT * FROM bookshelf WHERE user_id = #{userId} ORDER BY last_read_time DESC")
    List<BookshelfEntity> findByUserIdOrderByLastReadTimeDesc(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM bookshelf WHERE user_id = #{userId}")
    int countByUserId(@Param("userId") Long userId);
}
