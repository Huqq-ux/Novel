package com.novel.payment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.novel.common.entity.CoinRechargeRecord;
import com.novel.common.entity.RechargePackage;
import com.novel.common.entity.User;
import com.novel.payment.mapper.CoinRechargeRecordMapper;
import com.novel.payment.mapper.RechargePackageMapper;
import com.novel.payment.mapper.UserMapper;
import com.novel.payment.service.CoinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class CoinServiceImpl implements CoinService {

    @Autowired
    private RechargePackageMapper rechargePackageMapper;

    @Autowired
    private CoinRechargeRecordMapper rechargeRecordMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public List<RechargePackage> getActivePackages() {
        QueryWrapper<RechargePackage> query = new QueryWrapper<>();
        query.eq("is_active", 1).orderByAsc("sort_order");
        return rechargePackageMapper.selectList(query);
    }

    @Override
    @Transactional
    public Map<String, Object> recharge(Long userId, Long packageId, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            String redisKey = "recharge:idempotent:" + idempotencyKey;
            Boolean isNew = redisTemplate.opsForValue().setIfAbsent(redisKey, "1", 5, TimeUnit.MINUTES);
            if (Boolean.FALSE.equals(isNew)) {
                throw new IllegalArgumentException("请勿重复提交");
            }
        }

        if (packageId == null) {
            throw new IllegalArgumentException("请选择充值套餐");
        }

        RechargePackage pkg = rechargePackageMapper.selectById(packageId);
        if (pkg == null || pkg.getIsActive() != 1) {
            throw new IllegalArgumentException("无效的充值套餐");
        }

        int totalCoins = pkg.getCoins() + pkg.getBonus();

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }

        int currentBalance = user.getCoinBalance() != null ? user.getCoinBalance() : 0;
        user.setCoinBalance(currentBalance + totalCoins);
        userMapper.updateById(user);

        CoinRechargeRecord record = new CoinRechargeRecord();
        record.setUserId(userId);
        record.setAmount(totalCoins);
        record.setPaymentMethod("mock");
        record.setTransactionId("MOCK_" + System.currentTimeMillis() + "_" + userId);
        record.setStatus(1);
        record.setCreateTime(LocalDateTime.now());
        rechargeRecordMapper.insert(record);

        Map<String, Object> result = new HashMap<>();
        result.put("amount", totalCoins);
        result.put("newBalance", user.getCoinBalance());
        result.put("transactionId", record.getTransactionId());
        return result;
    }

    @Override
    public Map<String, Object> getBalance(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        Map<String, Object> result = new HashMap<>();
        result.put("balance", user.getCoinBalance() != null ? user.getCoinBalance() : 0);
        return result;
    }

    @Override
    public List<CoinRechargeRecord> getRecentRecords(Long userId, int limit) {
        QueryWrapper<CoinRechargeRecord> query = new QueryWrapper<>();
        query.eq("user_id", userId).orderByDesc("create_time").last("LIMIT " + limit);
        return rechargeRecordMapper.selectList(query);
    }
}
