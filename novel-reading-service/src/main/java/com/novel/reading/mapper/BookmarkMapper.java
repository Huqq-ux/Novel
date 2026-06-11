package com.novel.reading.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.Bookmark;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface BookmarkMapper extends BaseMapper<Bookmark> {

    List<Bookmark> selectByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);

    Bookmark selectByUserAndChapter(@Param("userId") Long userId, @Param("bookId") Long bookId, @Param("chapterId") Long chapterId);
}
