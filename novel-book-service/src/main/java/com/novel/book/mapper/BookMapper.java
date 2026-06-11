package com.novel.book.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.common.entity.Book;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface BookMapper extends BaseMapper<Book> {

    Page<Book> selectByCategory(Page<Book> page, @Param("category") String category);

    Page<Book> selectByIsFinished(Page<Book> page, @Param("isFinished") Boolean isFinished);

    Page<Book> selectPageWithSort(Page<Book> page, @Param("sort") String sort);

    List<Book> searchBooks(@Param("keyword") String keyword);

    List<Book> findFinishedBooks(Page<Book> page);

    List<Book> findRecentBooks(Page<Book> page);
}
