package com.novel.reading.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.Bookshelf;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface BookshelfMapper extends BaseMapper<Bookshelf> {

    List<Bookshelf> selectByUserId(@Param("userId") Long userId);

    Bookshelf selectByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);

    int deleteByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);
}
