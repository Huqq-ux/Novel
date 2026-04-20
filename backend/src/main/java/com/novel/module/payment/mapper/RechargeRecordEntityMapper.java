package com.novel.module.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.module.payment.entity.RechargeRecordEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RechargeRecordEntityMapper extends BaseMapper<RechargeRecordEntity> {

    @Select("SELECT * FROM coin_recharge_records WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<RechargeRecordEntity> findByUserIdOrderByCreateTimeDesc(@Param("userId") Long userId);

    @Select("SELECT SUM(coins) FROM coin_recharge_records WHERE user_id = #{userId} AND status = 1")
    Integer sumCoinsByUserId(@Param("userId") Long userId);
}
