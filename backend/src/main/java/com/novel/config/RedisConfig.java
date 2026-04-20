package com.novel.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis缓存配置类
 * 
 * 配置Redis连接和缓存管理器，支持Spring Cache注解和手动缓存操作。
 * 
 * 设计考量：
 * 1. 使用Jackson序列化，支持复杂对象存储
 * 2. 注册JavaTimeModule处理Java 8日期时间类型
 * 3. 配置不同缓存空间的过期时间
 * 4. 禁用空值缓存，防止缓存穿透由业务层处理
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * 创建RedisTemplate Bean
     * 
     * 功能描述：
     * 配置Redis操作模板，支持String键和Object值的存储。
     * 
     * 实现逻辑：
     * 1. 创建RedisTemplate并设置连接工厂
     * 2. 配置ObjectMapper处理JSON序列化
     * 3. 注册JavaTimeModule支持Java 8日期时间
     * 4. 设置键使用String序列化器
     * 5. 设置值使用JSON序列化器
     * 
     * 设计考量：
     * - 键使用String序列化，便于在Redis中查看
     * - 值使用JSON序列化，支持复杂对象
     * - 启用类型信息，支持多态对象存储
     * - 禁用日期时间戳格式，使用ISO-8601格式
     * 
     * @param connectionFactory Redis连接工厂
     * @return RedisTemplate<String, Object> Redis操作模板
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();

        return template;
    }

    /**
     * 创建缓存管理器Bean
     * 
     * 功能描述：
     * 配置Spring Cache使用的Redis缓存管理器。
     * 
     * 实现逻辑：
     * 1. 创建默认缓存配置（30分钟过期）
     * 2. 为不同缓存空间配置不同过期时间
     * 3. 构建RedisCacheManager
     * 
     * 设计考量：
     * - 书籍缓存1小时，数据相对稳定
     * - 章节缓存30分钟，更新频率中等
     * - 用户缓存30分钟，平衡实时性和性能
     * - 评分缓存10分钟，变化较频繁
     * - 列表缓存5分钟，查询条件多变
     * - 禁用空值缓存，由业务层处理穿透问题
     * 
     * @param factory Redis连接工厂
     * @return CacheManager 缓存管理器
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(jsonSerializer))
            .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        cacheConfigurations.put("book", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("chapter", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("user", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("rating", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("list", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }
}
