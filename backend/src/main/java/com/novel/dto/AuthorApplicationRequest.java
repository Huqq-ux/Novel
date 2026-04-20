package com.novel.dto;

import lombok.Data;
import java.util.List;

@Data
public class AuthorApplicationRequest {
    private String realName;
    private String phone;
    private String email;
    private String penName;
    private String specialty;
    private List<String> workSamples;
    private String introduction;
    private String verifyCode;
}
