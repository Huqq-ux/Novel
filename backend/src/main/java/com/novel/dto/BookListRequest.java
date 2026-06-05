package com.novel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BookListRequest {
    @NotBlank(message = "书单标题不能为空")
    private String title;

    private String description;
    private String cover;
    private Boolean isPublic;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCover() { return cover; }
    public void setCover(String cover) { this.cover = cover; }
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
}
