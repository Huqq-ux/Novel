package com.novel.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis-Plus配置类
 *
 * 配置MyBatis-Plus插件，增强MyBatis功能。
 *
 * 设计考量：
 * 1. MyBatis-Plus 3.5.9+ 分页插件已内置，无需手动添加PaginationInnerInterceptor
 * 2. 分页查询自动转换为对应数据库的分页SQL
 * 3. 避免内存分页导致的性能问题
 */
@Configuration
public class MyBatisPlusConfig {

    /**
     * 创建MyBatis-Plus拦截器Bean
     *
     * 功能描述：
     * 配置MyBatis-Plus拦截器，分页插件已内置，支持物理分页。
     *
     * 实现逻辑：
     * 1. 创建MybatisPlusInterceptor拦截器（分页已内置）
     *
     * 设计考量：
     * - 分页插件自动处理不同数据库的分页语法
     * - 物理分页避免内存溢出风险
     * - 支持MySQL、PostgreSQL等主流数据库
     * - 分页参数通过Page对象传递
     *
     * @return MybatisPlusInterceptor MyBatis-Plus拦截器
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        return new MybatisPlusInterceptor();
    }
}
