package com.novel.book.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.Chapter;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ChapterMapper extends BaseMapper<Chapter> {

    List<Chapter> selectByBookIdOrderByOrderNum(@Param("bookId") Long bookId);

    Chapter selectByBookIdAndOrderNum(@Param("bookId") Long bookId, @Param("orderNum") Integer orderNum);
}
