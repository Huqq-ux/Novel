package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("recharge_packages")
public class RechargePackage {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Integer coins;
    private BigDecimal price;
    private Integer bonus;
    private Integer sortOrder;
    private Integer isActive;
    private LocalDateTime createTime;
}
