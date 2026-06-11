package com.novel.user.service.impl;

import com.novel.common.entity.User;
import com.novel.user.mapper.UserMapper;
import com.novel.user.cache.UserCacheService;
import com.novel.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserCacheService userCacheService;

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

    @Override
    public User getUserById(Long id) {
        return userCacheService.getUserById(id, () -> userMapper.selectById(id));
    }

    @Override
    public User getUserByUsername(String username) {
        return userMapper.selectByUsername(username);
    }
}
