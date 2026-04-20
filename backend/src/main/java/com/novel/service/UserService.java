package com.novel.service;

import com.novel.entity.User;

public interface UserService {
    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     * @return 用户实体，如果登录失败则返回null
     */
    User login(String username, String password);
    
    /**
     * 用户注册
     * @param username 用户名
     * @param password 密码
     * @param email 邮箱
     * @return 新创建的用户实体
     */
    User register(String username, String password, String email);
    
    /**
     * 根据ID获取用户信息
     * @param id 用户ID
     * @return 用户实体
     */
    User getUserById(Long id);
    
    /**
     * 根据用户名获取用户信息
     * @param username 用户名
     * @return 用户实体
     */
    User getUserByUsername(String username);
}