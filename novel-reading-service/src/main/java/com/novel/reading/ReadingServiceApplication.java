package com.novel.reading;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(scanBasePackages = {"com.novel.reading", "com.novel.common"})
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.novel.reading.feign")
@MapperScan("com.novel.reading.mapper")
public class ReadingServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReadingServiceApplication.class, args);
    }
}
