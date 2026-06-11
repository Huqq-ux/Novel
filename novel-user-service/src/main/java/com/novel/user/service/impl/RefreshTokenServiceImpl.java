package com.novel.user.service.impl;

import com.novel.common.entity.RefreshToken;
import com.novel.user.mapper.RefreshTokenMapper;
import com.novel.user.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    @Autowired
    private RefreshTokenMapper refreshTokenMapper;

    @Value("${jwt.refresh-expiration:604800000}")
    private Long refreshExpiration;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        refreshTokenMapper.revokeByUserId(userId);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000));
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshToken.setRevoked(false);
        refreshTokenMapper.insert(refreshToken);
        return refreshToken;
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenMapper.findByToken(token);
    }

    @Override
    public boolean validateToken(RefreshToken token) {
        return !token.getRevoked() && token.getExpiresAt().isAfter(LocalDateTime.now());
    }

    @Override
    public void revokeByUserId(Long userId) {
        refreshTokenMapper.revokeByUserId(userId);
    }

    @Override
    @Scheduled(cron = "0 0 3 * * ?")
    public void deleteExpiredTokens() {
        refreshTokenMapper.deleteExpiredTokens();
    }
}
