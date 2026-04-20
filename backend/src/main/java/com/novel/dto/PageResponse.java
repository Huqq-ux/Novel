package com.novel.dto;

import java.util.List;

/**
 * 分页响应类
 * 用于封装分页数据和总数
 * @param <T> 分页数据类型
 */
public class PageResponse<T> {
    private List<T> list;
    private Long total;

    public PageResponse(List<T> list, Long total) {
        this.list = list;
        this.total = total;
    }

    public List<T> getList() {
        return list;
    }

    public void setList(List<T> list) {
        this.list = list;
    }

    public Long getTotal() {
        return total;
    }

    public void setTotal(Long total) {
        this.total = total;
    }
}