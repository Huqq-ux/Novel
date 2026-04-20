package com.novel.module.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.user.entity.UserEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserEntityMapper extends BaseMapper<UserEntity> {

    @Update("UPDATE users SET coin_balance = coin_balance + #{amount} WHERE id = #{userId}")
    int addCoins(@Param("userId") Long userId, @Param("amount") Integer amount);

    @Update("UPDATE users SET coin_balance = coin_balance - #{amount} WHERE id = #{userId} AND coin_balance >= #{amount}")
    int deductCoins(@Param("userId") Long userId, @Param("amount") Integer amount);

    @Update("UPDATE users SET last_login_time = #{loginTime} WHERE id = #{userId}")
    int updateLoginTime(@Param("userId") Long userId, @Param("loginTime") java.time.LocalDateTime loginTime);
}
