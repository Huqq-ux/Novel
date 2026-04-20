package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.Chapter;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 章节数据访问接口
 * 
 * 提供章节实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 包含基本的CRUD操作和章节相关的自定义查询方法。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 自定义方法处理章节排序查询
 * 3. 使用@Param注解明确参数映射
 * 4. 章节按orderNum排序，确保阅读顺序正确
 */
public interface ChapterMapper extends BaseMapper<Chapter> {

    /**
     * 查询书籍的所有章节（按章节序号排序）
     * 
     * 功能描述：
     * 查询指定书籍的所有章节，按orderNum升序排列。
     * 
     * 设计考量：
     * - 按orderNum排序确保章节顺序正确
     * - 返回章节列表不包含正文内容，减少数据传输
     * - 用于章节目录展示
     * 
     * @param bookId 书籍ID
     * @return List<Chapter> 章节列表，按orderNum升序
     */
    List<Chapter> selectByBookIdOrderByOrderNum(@Param("bookId") Long bookId);

    /**
     * 根据书籍ID和章节序号查询章节
     * 
     * 功能描述：
     * 查询指定书籍中指定序号的章节。
     * 
     * 设计考量：
     * - 用于按章节序号跳转阅读
     * - bookId和orderNum联合确定唯一章节
     * - 返回完整章节信息，包含正文内容
     * 
     * @param bookId  书籍ID
     * @param orderNum 章节序号
     * @return Chapter 章节对象，不存在返回null
     */
    Chapter selectByBookIdAndOrderNum(@Param("bookId") Long bookId, @Param("orderNum") Integer orderNum);
}
