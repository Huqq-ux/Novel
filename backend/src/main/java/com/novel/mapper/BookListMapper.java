package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.BookList;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface BookListMapper extends BaseMapper<BookList> {

    List<BookList> selectPublicLists(@Param("offset") int offset, @Param("size") int size, @Param("sort") String sort);

    List<BookList> selectByUserId(@Param("userId") Long userId);
}
