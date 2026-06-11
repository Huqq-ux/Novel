package com.novel.reading.feign;

import com.novel.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

@FeignClient(name = "novel-payment-service")
public interface PaymentFeignClient {
    @PostMapping("/api/coin/deduct")
    ApiResponse<Boolean> deductCoins(@RequestBody Map<String, Object> request,
                                     @RequestHeader("X-User-Id") Long userId);
}
