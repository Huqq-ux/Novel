package com.novel.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis-Plus配置类
 *
 * 配置MyBatis-Plus拦截器插件，核心职责是注册物理分页拦截器。
 *
 * MyBatis-Plus 3.5.9 模块拆分说明：
 * PaginationInnerInterceptor 在 3.5.9 中从 mybatis-plus-extension 拆分到了
 * 独立模块 mybatis-plus-jsqlparser。必须显式添加该依赖，否则编译期找不到类。
 *
 * 设计考量：
 * 1. MybatisPlusInterceptor 是拦截器容器，自身不含任何分页逻辑
 * 2. 必须显式添加 PaginationInnerInterceptor 才能实现物理分页
 * 3. 未配置 PaginationInnerInterceptor 时，Page 查询会退化为内存分页，
 *    即先加载全部数据行到 JVM 堆中再截取，存在 OOM 风险
 * 4. 指定 DbType.MYSQL 确保分页 SQL 使用 MySQL 方言（LIMIT/OFFSET）
 */
@Configuration
public class MyBatisPlusConfig {

    /**
     * 创建MyBatis-Plus拦截器Bean，注册MySQL物理分页插件
     *
     * 功能描述：
     * 1. 创建 MybatisPlusInterceptor 容器
     * 2. 向容器中注册 PaginationInnerInterceptor(DbType.MYSQL)
     * 3. 所有分页查询（Page 对象）自动转换为 LIMIT/OFFSET 物理分页 SQL
     *
     * 实现逻辑：
     * 1. MybatisPlusInterceptor 作为拦截器入口（容器模式）
     * 2. PaginationInnerInterceptor 拦截 Executor.query，改写 SQL 追加分页子句
     * 3. 同时拦截结果集，将总数写入 Page.total 字段
     *
     * 风险说明：
     * - 如果只创建 MybatisPlusInterceptor 而不添加 PaginationInnerInterceptor，
     *   Page 查询将静默退化为内存分页：MyBatis 执行完整 SELECT，将所有行加载到
     *   JVM 堆内存后由 Page 对象在应用层截取子列表。数据量大时直接 OOM。
     *
     * @return MybatisPlusInterceptor 已注册分页插件的拦截器容器
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
