package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.ChapterUnlock;
import org.apache.ibatis.annotations.Mapper;

/**
 * 章节解锁数据访问接口
 * 
 * 提供章节解锁记录实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 记录用户使用虚拟币解锁付费章节的历史。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 用户解锁章节后可永久阅读
 * 3. 用户ID和章节ID联合确定唯一解锁记录
 * 4. 支持解锁记录查询和统计
 */
@Mapper
public interface ChapterUnlockMapper extends BaseMapper<ChapterUnlock> {
}
