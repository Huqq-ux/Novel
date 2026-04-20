package com.novel.service;

import com.novel.entity.RefreshToken;

import java.util.Optional;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(Long userId);
    Optional<RefreshToken> findByToken(String token);
    boolean validateToken(RefreshToken token);
    void revokeByUserId(Long userId);
    void deleteExpiredTokens();
}
