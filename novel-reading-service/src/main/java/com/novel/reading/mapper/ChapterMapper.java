package com.novel.reading.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.Chapter;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ChapterMapper extends BaseMapper<Chapter> {

    List<Chapter> selectByBookIdOrderByOrderNum(@Param("bookId") Long bookId);
}
