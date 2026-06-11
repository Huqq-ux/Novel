package com.novel.interaction.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.BookListItem;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface BookListItemMapper extends BaseMapper<BookListItem> {

    List<BookListItem> selectByListId(@Param("listId") Long listId);

    BookListItem selectByListIdAndBookId(@Param("listId") Long listId, @Param("bookId") Long bookId);

    int deleteByListIdAndBookId(@Param("listId") Long listId, @Param("bookId") Long bookId);

    int countByListId(@Param("listId") Long listId);
}
