package com.novel.service;

import com.novel.dto.SignInStatusDTO;

public interface SignInService {
    
    SignInStatusDTO getSignInStatus(Long userId);
    
    boolean signIn(Long userId);
}
