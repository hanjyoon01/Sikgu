package com.sikgu.sikgubackend.service;

import com.sikgu.sikgubackend.dto.LoginRequest;
import com.sikgu.sikgubackend.dto.LoginResponse;
import com.sikgu.sikgubackend.dto.SignupRequest;
import com.sikgu.sikgubackend.dto.UserDto;
import com.sikgu.sikgubackend.security.jwt.util.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final UserService userService; // 회원가입 및 프로필 조회를 위해 필요
    private final TokenBlacklistService blacklistService;

    public LoginResponse login(LoginRequest loginRequest) {
        // 1) 인증 객체 생성 및 인증 관리자 호출 (인증 시도)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2) 인증 성공 후 Context에 저장 (선택 사항이지만, 일부 Flow에 필요할 수 있음)
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3) 토큰 생성
        String token = jwtTokenUtil.generateToken(authentication.getName());

        // 4) 응답 DTO 반환
        return new LoginResponse(token);
    }

    public boolean signup(SignupRequest signupRequest) {
        return userService.signup(signupRequest);
    }

    public UserDto getUserProfile(String email) {
        return userService.getUserProfile(email);
    }

    public void logout(String jwt) {
        // 토큰이 유효한지 확인하고 블랙리스트에 등록
        blacklistService.blacklistToken(jwt);
    }
}