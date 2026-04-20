package com.novel.module.content.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.content.entity.BookEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface BookEntityMapper extends BaseMapper<BookEntity> {

    @Update("UPDATE books SET rating = #{rating} WHERE id = #{bookId}")
    int updateRating(@Param("bookId") Long bookId, @Param("rating") Double rating);

    @Update("UPDATE books SET click_count = click_count + 1 WHERE id = #{bookId}")
    int incrementClickCount(@Param("bookId") Long bookId);

    @Update("UPDATE books SET collect_count = collect_count + 1 WHERE id = #{bookId}")
    int incrementCollectCount(@Param("bookId") Long bookId);

    @Update("UPDATE books SET collect_count = collect_count - 1 WHERE id = #{bookId} AND collect_count > 0")
    int decrementCollectCount(@Param("bookId") Long bookId);
}
