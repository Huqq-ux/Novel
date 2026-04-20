package com.novel.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.dto.ApiResponse;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import com.novel.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 书籍控制器
 * 
 * 提供书籍相关的RESTful API接口，包括书籍列表查询、详情获取、章节管理和搜索功能。
 * 所有接口均通过Redis缓存层进行数据访问优化，提高响应速度。
 * 
 * 设计考量：
 * 1. 采用RESTful风格设计API，资源路径清晰
 * 2. 支持多维度查询参数，满足不同业务场景
 * 3. 缓存策略：书籍详情缓存1小时，章节内容缓存30分钟
 */
@RestController
@RequestMapping("/books")
public class BookController {

    @Autowired
    private BookService bookService;

    /**
     * 获取书籍分页列表
     * 
     * 功能描述：
     * 根据多种筛选条件查询书籍列表，支持分页、分类筛选、排序和状态过滤。
     * 
     * 实现逻辑：
     * 1. 接收前端传递的分页参数和筛选条件
     * 2. 调用BookService进行数据查询
     * 3. 返回分页结果，包含书籍基本信息
     * 
     * 设计考量：
     * - 使用默认值确保接口健壮性，避免空参数导致的异常
     * - 支持多条件组合查询，提高接口灵活性
     * - 暂未对列表接口添加缓存，因为查询条件组合过多，缓存命中率低
     * 
     * @param page      当前页码，默认值为1，取值范围：正整数
     * @param size      每页数量，默认值为10，取值范围：1-100
     * @param category  分类名称，可选参数，为空则查询全部分类
     * @param sort      排序字段，可选值：clickCount(点击量)、createTime(创建时间)、rating(评分)
     * @param isFinished 是否完结，可选参数，为空则查询全部状态
     * @param priceType 价格类型，0-免费，1-付费，为空则查询全部类型
     * @return ApiResponse<Page<Book>> 分页书籍列表，包含总数和当前页数据
     */
    @GetMapping
    public ApiResponse<Page<Book>> getAllBooks(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Boolean isFinished,
            @RequestParam(required = false) Integer priceType) {
        Page<Book> result = bookService.getAllBooksPage(page, size, category, sort, isFinished, priceType);
        return ApiResponse.success(result);
    }

    /**
     * 获取书籍详情
     * 
     * 功能描述：
     * 根据书籍ID获取完整的书籍信息，包括书名、作者、简介、封面、统计数据等。
     * 
     * 实现逻辑：
     * 1. 从Redis缓存中尝试获取书籍详情
     * 2. 缓存未命中时查询数据库并写入缓存
     * 3. 缓存过期时间为1小时，采用随机过期策略防止缓存雪崩
     * 
     * 设计考量：
     * - 书籍详情是高频访问数据，适合缓存
     * - 采用"缓存空值"策略防止缓存穿透
     * - 返回404状态码而非抛出异常，便于前端统一处理
     * 
     * @param id 书籍唯一标识，取值范围：正整数
     * @return ApiResponse<Book> 书籍详情对象，不存在时返回404错误
     */
    @GetMapping("/{id}")
    public ApiResponse<Book> getBookById(@PathVariable Long id) {
        Book book = bookService.getBookById(id);
        if (book == null) {
            return ApiResponse.error(404, "书籍不存在");
        }
        return ApiResponse.success(book);
    }

    /**
     * 获取书籍章节列表
     * 
     * 功能描述：
     * 获取指定书籍的所有章节信息，按章节顺序排列，不包含章节内容。
     * 
     * 实现逻辑：
     * 1. 从Redis缓存中尝试获取章节列表
     * 2. 缓存未命中时查询数据库
     * 3. 返回章节基本信息（标题、字数、价格等）
     * 
     * 设计考量：
     * - 章节列表相对稳定，适合缓存
     * - 不返回章节内容，减少数据传输量
     * - 对于付费书籍，前端根据章节价格显示解锁状态
     * 
     * @param id 书籍唯一标识，取值范围：正整数
     * @return ApiResponse<List<Chapter>> 章节列表，按orderNum升序排列
     */
    @GetMapping("/{id}/chapters")
    public ApiResponse<List<Chapter>> getChaptersByBookId(@PathVariable Long id) {
        List<Chapter> chapters = bookService.getChaptersByBookId(id);
        return ApiResponse.success(chapters);
    }

    /**
     * 获取章节详细内容
     * 
     * 功能描述：
     * 获取指定章节的完整内容，包括标题、正文、字数等信息。
     * 对于付费章节，需要验证用户是否已解锁。
     * 
     * 实现逻辑：
     * 1. 验证章节是否属于指定书籍（防止越权访问）
     * 2. 从Redis缓存获取章节内容
     * 3. 缓存未命中时查询数据库并写入缓存
     * 4. 采用互斥锁策略防止缓存击穿
     * 
     * 设计考量：
     * - 章节内容是核心业务数据，访问量极大
     * - 使用互斥锁防止热点章节的缓存击穿问题
     * - 缓存空值防止无效章节ID的缓存穿透
     * - bookId参数用于权限校验，确保用户访问正确的章节
     * 
     * @param bookId    书籍唯一标识，用于权限校验
     * @param chapterId 章节唯一标识
     * @return ApiResponse<Chapter> 章节详情，不存在时返回404错误
     */
    @GetMapping("/{bookId}/chapters/{chapterId}")
    public ApiResponse<Chapter> getChapterById(@PathVariable Long bookId, @PathVariable Long chapterId) {
        Chapter chapter = bookService.getChapterById(bookId, chapterId);
        if (chapter == null) {
            return ApiResponse.error(404, "章节不存在");
        }
        return ApiResponse.success(chapter);
    }

    /**
     * 搜索书籍
     * 
     * 功能描述：
     * 根据关键词搜索书籍，匹配书名、作者名和简介等字段。
     * 
     * 实现逻辑：
     * 1. 对关键词进行空值校验和去空格处理
     * 2. 调用BookService执行模糊查询
     * 3. 返回匹配的书籍列表
     * 
     * 设计考量：
     * - 空关键词直接返回空列表，避免无效数据库查询
     * - 搜索结果缓存5分钟，减少重复搜索压力
     * - 使用关键词hashCode作为缓存key，避免特殊字符问题
     * - 暂未实现搜索结果分页，后续可优化
     * 
     * @param keyword 搜索关键词，不能为空
     * @return ApiResponse<List<Book>> 匹配的书籍列表，无结果时返回空列表
     */
    @GetMapping("/search")
    public ApiResponse<List<Book>> searchBooks(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return ApiResponse.success(java.util.Collections.emptyList());
        }
        List<Book> books = bookService.searchBooks(keyword.trim());
        return ApiResponse.success(books);
    }
}
