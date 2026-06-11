package com.novel.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.SignInRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;

@Mapper
public interface SignInMapper extends BaseMapper<SignInRecord> {

    @Select("SELECT * FROM sign_in_records WHERE user_id = #{userId} AND sign_date = #{signDate}")
    SignInRecord selectByUserIdAndDate(Long userId, LocalDate signDate);

    @Select("SELECT * FROM sign_in_records WHERE user_id = #{userId} ORDER BY sign_date DESC LIMIT 1")
    SignInRecord selectLatestByUserId(Long userId);

    @Select("SELECT COUNT(*) FROM sign_in_records WHERE user_id = #{userId}")
    int countByUserId(Long userId);
}
