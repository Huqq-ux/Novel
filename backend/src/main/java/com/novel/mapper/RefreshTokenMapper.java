package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.RefreshToken;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

/**
 * 刷新令牌数据访问接口
 * 
 * 提供刷新令牌实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 管理JWT刷新令牌的持久化存储。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 支持令牌撤销机制，增强安全性
 * 3. 定期清理过期令牌，避免数据膨胀
 * 4. 使用Optional包装返回值，明确空值语义
 */
public interface RefreshTokenMapper extends BaseMapper<RefreshToken> {

    /**
     * 根据令牌字符串查询令牌记录
     * 
     * 功能描述：
     * 根据令牌字符串查询完整的令牌记录。
     * 
     * 设计考量：
     * - 用于令牌验证时获取完整信息
     * - 返回Optional明确表示可能不存在
     * - 包含用户关联信息
     * 
     * @param token 令牌字符串
     * @return Optional<RefreshToken> 令牌记录，不存在返回empty
     */
    Optional<RefreshToken> findByToken(@Param("token") String token);

    /**
     * 撤销用户的所有刷新令牌
     * 
     * 功能描述：
     * 撤销指定用户的所有刷新令牌，使其失效。
     * 
     * 设计考量：
     * - 用于用户修改密码或强制登出时
     * - 批量撤销提高效率
     * - 撤销后令牌无法继续使用
     * 
     * @param userId 用户ID
     */
    void revokeByUserId(@Param("userId") Long userId);

    /**
     * 删除过期的令牌记录
     * 
     * 功能描述：
     * 删除所有已过期的刷新令牌记录。
     * 
     * 设计考量：
     * - 定时任务调用，清理过期数据
     * - 避免令牌表数据膨胀
     * - 提高查询性能
     */
    void deleteExpiredTokens();
}
