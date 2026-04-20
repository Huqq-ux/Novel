package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.entity.Book;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 书籍数据访问接口
 * 
 * 提供书籍实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 包含基本的CRUD操作和自定义查询方法。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 自定义方法处理复杂查询场景
 * 3. 使用@Param注解明确参数映射
 * 4. 分页查询使用Page对象封装结果
 */
public interface BookMapper extends BaseMapper<Book> {

    /**
     * 按分类查询书籍分页列表
     * 
     * 功能描述：
     * 查询指定分类下的所有书籍，返回分页结果。
     * 
     * @param page     分页参数对象
     * @param category 分类名称
     * @return Page<Book> 分页书籍列表
     */
    Page<Book> selectByCategory(Page<Book> page, @Param("category") String category);

    /**
     * 按完结状态查询书籍分页列表
     * 
     * 功能描述：
     * 查询指定完结状态的书籍，返回分页结果。
     * 
     * @param page       分页参数对象
     * @param isFinished 是否完结
     * @return Page<Book> 分页书籍列表
     */
    Page<Book> selectByIsFinished(Page<Book> page, @Param("isFinished") Boolean isFinished);

    /**
     * 带排序的分页查询
     * 
     * 功能描述：
     * 查询所有书籍并按指定字段排序，返回分页结果。
     * 
     * @param page 分页参数对象
     * @param sort 排序字段
     * @return Page<Book> 分页书籍列表
     */
    Page<Book> selectPageWithSort(Page<Book> page, @Param("sort") String sort);

    /**
     * 搜索书籍
     * 
     * 功能描述：
     * 根据关键词模糊搜索书籍，匹配书名、作者和简介。
     * 
     * 设计考量：
     * - 使用LIKE进行模糊匹配
     * - 搜索结果限制数量，避免大量数据返回
     * 
     * @param keyword 搜索关键词
     * @return List<Book> 匹配的书籍列表
     */
    List<Book> searchBooks(@Param("keyword") String keyword);

    /**
     * 查询已完结书籍
     * 
     * 功能描述：
     * 查询所有已完结的书籍列表。
     * 
     * @param page 分页参数对象
     * @return List<Book> 已完结书籍列表
     */
    List<Book> findFinishedBooks(Page<Book> page);

    /**
     * 查询最近更新书籍
     * 
     * 功能描述：
     * 查询最近更新的书籍列表，按更新时间倒序。
     * 
     * @param page 分页参数对象
     * @return List<Book> 最近更新书籍列表
     */
    List<Book> findRecentBooks(Page<Book> page);
}
