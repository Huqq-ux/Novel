package com.novel.service.impl;

import com.novel.entity.User;
import com.novel.mapper.UserMapper;
import com.novel.cache.UserCacheService;
import com.novel.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 用户服务实现类
 * 
 * 提供用户相关的核心业务逻辑，包括登录、注册和信息查询。
 * 集成Redis缓存层，优化用户信息查询性能。
 * 
 * 设计考量：
 * 1. 密码使用BCrypt加密存储，防止明文泄露
 * 2. 用户信息缓存30分钟，登录时刷新缓存
 * 3. 唯一性校验在注册前执行，避免脏数据
 * 4. 登录成功更新最后登录时间，用于活跃度统计
 */
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserCacheService userCacheService;

    /**
     * 用户登录验证
     * 
     * 功能描述：
     * 验证用户凭证，成功则更新登录时间并刷新缓存。
     * 
     * 实现逻辑：
     * 1. 根据用户名查询用户记录
     * 2. 使用BCrypt验证密码
     * 3. 验证成功：更新最后登录时间
     * 4. 刷新用户缓存
     * 
     * 设计考量：
     * - 密码验证失败返回null而非抛出异常，便于Controller统一处理
     * - 不区分"用户不存在"和"密码错误"，防止用户名枚举攻击
     * - 登录成功后主动刷新缓存，确保数据一致性
     * - 最后登录时间用于活跃度分析和安全审计
     * 
     * @param username 用户名
     * @param password 明文密码
     * @return User 验证成功返回用户对象，失败返回null
     */
    @Override
    public User login(String username, String password) {
        User user = userMapper.selectByUsername(username);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            user.setLastLoginTime(LocalDateTime.now());
            userMapper.updateById(user);
            userCacheService.cacheUser(user);
            return user;
        }
        return null;
    }

    /**
     * 用户注册
     * 
     * 功能描述：
     * 创建新用户账户，包含唯一性校验和密码加密。
     * 
     * 实现逻辑：
     * 1. 校验用户名是否已存在
     * 2. 校验邮箱是否已注册
     * 3. 创建用户对象并加密密码
     * 4. 持久化到数据库
     * 5. 写入缓存
     * 
     * 设计考量：
     * - 唯一性校验在Service层执行，提供友好错误提示
     * - 密码使用BCrypt加密，安全性高于MD5
     * - 默认状态为1（正常），角色为user
     * - 注册成功后自动写入缓存，减少首次登录查询
     * - 抛出RuntimeException便于Controller捕获并返回错误信息
     * 
     * @param username 用户名
     * @param password 明文密码
     * @param email    邮箱地址
     * @return User 创建成功的用户对象
     * @throws RuntimeException 用户名或邮箱已存在时抛出
     */
    @Override
    public User register(String username, String password, String email) {
        if (userMapper.existsByUsername(username)) {
            throw new RuntimeException("用户名已存在");
        }
        
        if (userMapper.existsByEmail(email)) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setRegisterTime(LocalDateTime.now());
        user.setLastLoginTime(LocalDateTime.now());
        user.setStatus(1);
        userMapper.insert(user);
        userCacheService.cacheUser(user);
        return user;
    }

    /**
     * 根据ID获取用户信息
     * 
     * 功能描述：
     * 根据用户ID查询用户详细信息，优先从缓存读取。
     * 
     * 实现逻辑：
     * 1. 尝试从缓存获取用户信息
     * 2. 缓存未命中时查询数据库
     * 3. 查询结果写入缓存
     * 
     * 设计考量：
     * - 用户信息缓存30分钟
     * - 使用Lambda表达式延迟执行数据库查询
     * - 缓存空值防止缓存穿透
     * - 用户信息变更时需主动刷新缓存
     * 
     * @param id 用户唯一标识
     * @return User 用户对象，不存在时返回null
     */
    @Override
    public User getUserById(Long id) {
        return userCacheService.getUserById(id, () -> userMapper.selectById(id));
    }

    /**
     * 根据用户名获取用户信息
     * 
     * 功能描述：
     * 根据用户名精确查询用户信息，用于登录验证和JWT解析。
     * 
     * 实现逻辑：
     * 1. 直接查询数据库（用户名查询频率较低）
     * 2. 返回完整的用户对象
     * 
     * 设计考量：
     * - 用户名查询主要用于登录，频率不高，不缓存
     * - 返回完整用户对象，包含密码字段（需调用方注意安全）
     * - 用户名唯一，最多返回一条记录
     * 
     * @param username 用户名
     * @return User 用户对象，不存在时返回null
     */
    @Override
    public User getUserByUsername(String username) {
        return userMapper.selectByUsername(username);
    }
}
