package com.novel.user.service;

import com.novel.common.entity.RefreshToken;

import java.util.Optional;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(Long userId);
    Optional<RefreshToken> findByToken(String token);
    boolean validateToken(RefreshToken token);
    void revokeByUserId(Long userId);
    void deleteExpiredTokens();
}
