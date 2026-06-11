package com.novel.payment.service;

import com.novel.common.entity.CoinRechargeRecord;
import com.novel.common.entity.RechargePackage;

import java.util.List;
import java.util.Map;

public interface CoinService {
    List<RechargePackage> getActivePackages();
    Map<String, Object> recharge(Long userId, Long packageId, String idempotencyKey);
    Map<String, Object> getBalance(Long userId);
    List<CoinRechargeRecord> getRecentRecords(Long userId, int limit);
}
