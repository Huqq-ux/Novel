package com.novel.reading.feign;

import com.novel.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "novel-book-service")
public interface BookFeignClient {
    @GetMapping("/api/books/{bookId}/chapters/{chapterId}")
    ApiResponse<?> getChapter(@PathVariable Long bookId, @PathVariable Long chapterId);

    @GetMapping("/api/books/{id}")
    ApiResponse<?> getBook(@PathVariable Long id);
}
