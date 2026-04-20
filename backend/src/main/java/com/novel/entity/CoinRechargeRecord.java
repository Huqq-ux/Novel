package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("coin_recharge_records")
public class CoinRechargeRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Integer amount;
    private String paymentMethod;
    private String transactionId;
    private Integer status;
    private LocalDateTime createTime;
}
