package com.novel.module.user.service;

import com.novel.module.user.entity.UserEntity;
import java.util.Optional;

public interface UserDomainService {

    UserEntity create(UserEntity user);
    
    Optional<UserEntity> findById(Long id);
    
    Optional<UserEntity> findByUsername(String username);
    
    Optional<UserEntity> findByEmail(String email);
    
    UserEntity update(UserEntity user);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    boolean deductCoins(Long userId, Integer amount);
    
    boolean addCoins(Long userId, Integer amount);
    
    int getCoinBalance(Long userId);
    
    void updateLoginTime(Long userId);
}
