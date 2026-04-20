package com.novel.module.content.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.content.entity.ChapterEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ChapterEntityMapper extends BaseMapper<ChapterEntity> {

    @Select("SELECT * FROM chapters WHERE book_id = #{bookId} ORDER BY order_num ASC")
    List<ChapterEntity> findByBookIdOrderByOrderNum(@Param("bookId") Long bookId);

    @Select("SELECT COUNT(*) FROM chapters WHERE book_id = #{bookId}")
    int countByBookId(@Param("bookId") Long bookId);
}
