package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.User;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

/**
 * 用户数据访问接口
 * 
 * 提供用户实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 包含基本的CRUD操作和用户相关的自定义查询方法。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 自定义方法处理用户唯一性校验
 * 3. 使用@Param注解明确参数映射
 * 4. 用户名和邮箱的唯一性校验在注册时使用
 */
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据用户名查询用户
     * 
     * 功能描述：
     * 根据用户名精确查询用户信息，用于登录验证。
     * 
     * 设计考量：
     * - 用户名唯一，最多返回一条记录
     * - 返回完整用户对象，包含密码字段
     * - 主要用于登录验证，频率不高
     * 
     * @param username 用户名
     * @return User 用户对象，不存在返回null
     */
    User selectByUsername(@Param("username") String username);

    /**
     * 检查用户名是否存在
     * 
     * 功能描述：
     * 检查指定用户名是否已被注册。
     * 
     * 设计考量：
     * - 用于注册时的用户名唯一性校验
     * - 使用COUNT查询，性能优于SELECT *
     * - 返回boolean便于业务判断
     * 
     * @param username 用户名
     * @return boolean 存在返回true，不存在返回false
     */
    boolean existsByUsername(@Param("username") String username);

    /**
     * 检查邮箱是否存在
     * 
     * 功能描述：
     * 检查指定邮箱是否已被注册。
     * 
     * 设计考量：
     * - 用于注册时的邮箱唯一性校验
     * - 使用COUNT查询，性能优于SELECT *
     * - 返回boolean便于业务判断
     * 
     * @param email 邮箱地址
     * @return boolean 存在返回true，不存在返回false
     */
    boolean existsByEmail(@Param("email") String email);
}
