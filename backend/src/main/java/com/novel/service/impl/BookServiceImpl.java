package com.novel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import com.novel.mapper.BookMapper;
import com.novel.mapper.ChapterMapper;
import com.novel.cache.BookCacheService;
import com.novel.cache.ChapterCacheService;
import com.novel.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 书籍服务实现类
 * 
 * 提供书籍和章节相关的核心业务逻辑，包括查询、搜索等功能。
 * 集成Redis缓存层，优化高频访问数据的响应速度。
 * 
 * 设计考量：
 * 1. 采用Cache-Aside模式：先查缓存，未命中再查数据库
 * 2. 书籍详情缓存1小时，章节内容缓存30分钟
 * 3. 搜索结果缓存5分钟，减少重复搜索压力
 * 4. 使用Lambda表达式实现懒加载，避免不必要的数据库查询
 */
@Service
public class BookServiceImpl implements BookService {

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private BookCacheService bookCacheService;

    @Autowired
    private ChapterCacheService chapterCacheService;

    /**
     * 分页查询书籍列表
     * 
     * 功能描述：
     * 根据多种筛选条件分页查询书籍列表，支持分类、状态、价格类型和排序。
     * 
     * 实现逻辑：
     * 1. 构建MyBatis-Plus分页对象
     * 2. 根据参数动态构建查询条件
     * 3. 执行分页查询并返回结果
     * 
     * 设计考量：
     * - 列表查询条件组合多变，不适合缓存
     * - 使用QueryWrapper动态构建SQL，避免硬编码
     * - 默认按创建时间倒序排列，展示最新书籍
     * - 参数为null时使用默认值，确保查询健壮性
     * 
     * @param page       当前页码，null时默认为1
     * @param size       每页数量，null时默认为10
     * @param category   分类名称，为null则查询全部分类
     * @param sort       排序字段，支持clickCount、createTime、rating
     * @param isFinished 是否完结，为null则查询全部状态
     * @param priceType  价格类型，0-免费，1-付费，为null则查询全部
     * @return Page<Book> 分页结果，包含书籍列表和总数
     */
    @Override
    public Page<Book> getAllBooksPage(Integer page, Integer size, String category, String sort, Boolean isFinished, Integer priceType) {
        Page<Book> bookPage = new Page<>(page != null ? page : 1, size != null ? size : 10);
        
        QueryWrapper<Book> queryWrapper = new QueryWrapper<>();
        
        if (category != null && !category.isEmpty()) {
            queryWrapper.eq("category", category);
        }
        
        if (isFinished != null && isFinished) {
            queryWrapper.eq("is_finished", isFinished);
        }

        if (priceType != null) {
            queryWrapper.eq("price_type", priceType);
        }
        
        if (sort != null && !sort.isEmpty()) {
            if ("clickCount".equals(sort)) {
                queryWrapper.orderByDesc("click_count");
            } else if ("createTime".equals(sort)) {
                queryWrapper.orderByDesc("create_time");
            } else if ("rating".equals(sort)) {
                queryWrapper.orderByDesc("rating");
            } else {
                queryWrapper.orderByDesc("create_time");
            }
        } else {
            queryWrapper.orderByDesc("create_time");
        }
        
        return bookMapper.selectPage(bookPage, queryWrapper);
    }

    /**
     * 根据ID获取书籍详情
     * 
     * 功能描述：
     * 获取指定书籍的完整信息，优先从缓存读取。
     * 
     * 实现逻辑：
     * 1. 调用缓存服务尝试获取缓存
     * 2. 缓存未命中时执行数据库查询
     * 3. 查询结果写入缓存
     * 
     * 设计考量：
     * - 书籍详情是高频访问数据，缓存显著提升性能
     * - 使用Lambda表达式延迟执行数据库查询
     * - 缓存空值防止缓存穿透
     * - 缓存过期时间1小时，随机偏移防止雪崩
     * 
     * @param id 书籍唯一标识
     * @return Book 书籍详情对象，不存在时返回null
     */
    @Override
    public Book getBookById(Long id) {
        return bookCacheService.getBookById(id, () -> bookMapper.selectById(id));
    }

    /**
     * 获取书籍的章节列表
     * 
     * 功能描述：
     * 获取指定书籍的所有章节信息，按章节顺序排列。
     * 
     * 实现逻辑：
     * 1. 尝试从缓存获取章节列表
     * 2. 缓存未命中时查询数据库
     * 3. 按orderNum升序排列章节
     * 
     * 设计考量：
     * - 章节列表相对稳定，适合缓存
     * - 不返回章节内容，减少数据传输
     * - 章节列表缓存30分钟
     * - 书籍更新章节时需主动清除缓存
     * 
     * @param bookId 书籍ID
     * @return List<Chapter> 章节列表，按orderNum升序
     */
    @Override
    public List<Chapter> getChaptersByBookId(Long bookId) {
        return bookCacheService.getBookChapters(bookId, () -> chapterMapper.selectByBookIdOrderByOrderNum(bookId));
    }

    /**
     * 获取章节详细内容
     * 
     * 功能描述：
     * 获取指定章节的完整内容，包括标题、正文、字数等。
     * 
     * 实现逻辑：
     * 1. 验证章节是否属于指定书籍
     * 2. 尝试从缓存获取章节内容
     * 3. 缓存未命中时查询数据库
     * 
     * 设计考量：
     * - 章节内容是核心业务数据，访问量极大
     * - bookId参数用于权限校验，防止越权访问
     * - 使用互斥锁防止热点章节的缓存击穿
     * - 缓存空值防止无效章节ID的缓存穿透
     * 
     * @param bookId    书籍ID，用于权限校验
     * @param chapterId 章节ID
     * @return Chapter 章节详情，不存在或不属于该书籍时返回null
     */
    @Override
    public Chapter getChapterById(Long bookId, Long chapterId) {
        return chapterCacheService.getChapterById(bookId, chapterId, () -> chapterMapper.selectById(chapterId));
    }

    /**
     * 搜索书籍
     * 
     * 功能描述：
     * 根据关键词模糊搜索书籍，匹配书名、作者和简介。
     * 
     * 实现逻辑：
     * 1. 使用关键词hashCode构建缓存key
     * 2. 尝试从缓存获取搜索结果
     * 3. 缓存未命中时执行数据库模糊查询
     * 
     * 设计考量：
     * - 搜索结果缓存5分钟，减少重复搜索压力
     * - 使用hashCode作为key避免特殊字符问题
     * - 模糊查询使用LIKE，后续可优化为全文检索
     * - 搜索结果数量限制在100条以内
     * 
     * @param keyword 搜索关键词
     * @return List<Book> 匹配的书籍列表
     */
    @Override
    public List<Book> searchBooks(String keyword) {
        return bookCacheService.getSearchResults(keyword, () -> bookMapper.searchBooks(keyword));
    }
}
