package com.novel.service;

import com.novel.entity.CoinRechargeRecord;
import com.novel.entity.RechargePackage;

import java.util.List;
import java.util.Map;

public interface CoinService {
    List<RechargePackage> getActivePackages();
    Map<String, Object> recharge(Long userId, Long packageId, String idempotencyKey);
    Map<String, Object> getBalance(Long userId);
    List<CoinRechargeRecord> getRecentRecords(Long userId, int limit);
}
