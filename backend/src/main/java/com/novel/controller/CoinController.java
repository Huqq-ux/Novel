package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.entity.CoinRechargeRecord;
import com.novel.entity.RechargePackage;
import com.novel.security.CurrentUser;
import com.novel.service.CoinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/coin")
public class CoinController {

    @Autowired
    private CoinService coinService;

    @GetMapping("/packages")
    public ApiResponse<List<RechargePackage>> getPackages() {
        List<RechargePackage> packages = coinService.getActivePackages();
        return ApiResponse.success(packages);
    }

    @PostMapping("/recharge")
    public ApiResponse<Map<String, Object>> recharge(
            @CurrentUser Long userId,
            @RequestBody Map<String, Object> body) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        Long packageId = body.get("packageId") != null ? ((Number) body.get("packageId")).longValue() : null;
        String idempotencyKey = (String) body.get("idempotencyKey");

        try {
            Map<String, Object> result = coinService.recharge(userId, packageId, idempotencyKey);
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/balance")
    public ApiResponse<Map<String, Object>> getBalance(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            Map<String, Object> result = coinService.getBalance(userId);
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(404, e.getMessage());
        }
    }

    @GetMapping("/records")
    public ApiResponse<List<Map<String, Object>>> getRecords(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        List<CoinRechargeRecord> records = coinService.getRecentRecords(userId, 20);
        List<Map<String, Object>> result = new ArrayList<>();
        for (CoinRechargeRecord record : records) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", record.getId());
            map.put("amount", record.getAmount());
            map.put("paymentMethod", record.getPaymentMethod());
            map.put("transactionId", record.getTransactionId());
            map.put("status", record.getStatus());
            map.put("createTime", record.getCreateTime());
            result.add(map);
        }
        return ApiResponse.success(result);
    }
}
