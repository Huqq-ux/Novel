package com.novel.module.user.facade;

import com.novel.module.spi.UserServiceFacade;
import com.novel.module.user.entity.UserEntity;
import com.novel.module.user.service.UserDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserServiceFacadeImpl implements UserServiceFacade {

    @Autowired
    private UserDomainService userDomainService;

    @Override
    public boolean existsById(Long userId) {
        return userDomainService.findById(userId).isPresent();
    }

    @Override
    public Optional<UserInfo> getUserInfo(Long userId) {
        return userDomainService.findById(userId).map(this::toUserInfo);
    }

    @Override
    public Optional<UserInfo> getUserByUsername(String username) {
        return userDomainService.findByUsername(username).map(this::toUserInfo);
    }

    @Override
    public boolean deductCoins(Long userId, Integer amount) {
        return userDomainService.deductCoins(userId, amount);
    }

    @Override
    public boolean addCoins(Long userId, Integer amount) {
        return userDomainService.addCoins(userId, amount);
    }

    @Override
    public Integer getCoinBalance(Long userId) {
        return userDomainService.getCoinBalance(userId);
    }

    @Override
    public boolean isAuthor(Long userId) {
        Optional<UserEntity> user = userDomainService.findById(userId);
        return user.map(u -> u.getIsAuthor() != null && u.getIsAuthor() == 1).orElse(false);
    }

    private UserInfo toUserInfo(UserEntity entity) {
        UserInfo info = new UserInfo();
        info.setId(entity.getId());
        info.setUsername(entity.getUsername());
        info.setEmail(entity.getEmail());
        info.setAvatar(entity.getAvatar());
        info.setRole(entity.getRole());
        info.setCoinBalance(entity.getCoinBalance());
        info.setIsAuthor(entity.getIsAuthor());
        info.setPenName(entity.getPenName());
        return info;
    }
}
