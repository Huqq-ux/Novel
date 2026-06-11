package com.novel.payment.service;

import com.novel.common.dto.SignInStatusDTO;

public interface SignInService {

    SignInStatusDTO getSignInStatus(Long userId);

    boolean signIn(Long userId);
}
