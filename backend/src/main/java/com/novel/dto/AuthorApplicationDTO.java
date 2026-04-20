package com.novel.dto;

import lombok.Data;
import java.util.List;

@Data
public class AuthorApplicationDTO {
    private Long id;
    private Long userId;
    private String username;
    private String realName;
    private String phone;
    private String email;
    private String penName;
    private String specialty;
    private List<String> workSamples;
    private String introduction;
    private Integer status;
    private Integer verified;
    private String createTime;
    private String updateTime;
    
    private String auditComment;
    private String auditorName;
}
