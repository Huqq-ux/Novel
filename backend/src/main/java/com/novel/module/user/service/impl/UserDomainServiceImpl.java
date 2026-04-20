package com.novel.module.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.novel.module.user.entity.UserEntity;
import com.novel.module.user.mapper.UserEntityMapper;
import com.novel.module.user.service.UserDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserDomainServiceImpl implements UserDomainService {

    @Autowired
    private UserEntityMapper userMapper;

    @Override
    @Transactional
    public UserEntity create(UserEntity user) {
        user.setRegisterTime(LocalDateTime.now());
        user.setCoinBalance(0);
        user.setStatus(1);
        if (user.getRole() == null) {
            user.setRole("user");
        }
        userMapper.insert(user);
        return user;
    }

    @Override
    public Optional<UserEntity> findById(Long id) {
        return Optional.ofNullable(userMapper.selectById(id));
    }

    @Override
    public Optional<UserEntity> findByUsername(String username) {
        LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getUsername, username);
        return Optional.ofNullable(userMapper.selectOne(wrapper));
    }

    @Override
    public Optional<UserEntity> findByEmail(String email) {
        LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getEmail, email);
        return Optional.ofNullable(userMapper.selectOne(wrapper));
    }

    @Override
    @Transactional
    public UserEntity update(UserEntity user) {
        userMapper.updateById(user);
        return user;
    }

    @Override
    public boolean existsByUsername(String username) {
        LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getUsername, username);
        return userMapper.selectCount(wrapper) > 0;
    }

    @Override
    public boolean existsByEmail(String email) {
        LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getEmail, email);
        return userMapper.selectCount(wrapper) > 0;
    }

    @Override
    @Transactional
    public boolean deductCoins(Long userId, Integer amount) {
        if (amount <= 0) {
            return false;
        }
        return userMapper.deductCoins(userId, amount) > 0;
    }

    @Override
    @Transactional
    public boolean addCoins(Long userId, Integer amount) {
        if (amount <= 0) {
            return false;
        }
        return userMapper.addCoins(userId, amount) > 0;
    }

    @Override
    public int getCoinBalance(Long userId) {
        UserEntity user = userMapper.selectById(userId);
        return user != null ? (user.getCoinBalance() != null ? user.getCoinBalance() : 0) : 0;
    }

    @Override
    @Transactional
    public void updateLoginTime(Long userId) {
        userMapper.updateLoginTime(userId, LocalDateTime.now());
    }
}
