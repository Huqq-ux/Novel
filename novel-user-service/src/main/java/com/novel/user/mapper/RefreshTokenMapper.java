package com.novel.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.RefreshToken;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

public interface RefreshTokenMapper extends BaseMapper<RefreshToken> {

    Optional<RefreshToken> findByToken(@Param("token") String token);

    void revokeByUserId(@Param("userId") Long userId);

    void deleteExpiredTokens();
}
