
package com.sikgu.sikgubackend.controller;

import com.sikgu.sikgubackend.dto.LoginRequest;
import com.sikgu.sikgubackend.dto.LoginResponse;
import com.sikgu.sikgubackend.dto.SignupRequest;
import com.sikgu.sikgubackend.dto.UserDto;
import com.sikgu.sikgubackend.security.jwt.util.JwtTokenUtil;
import com.sikgu.sikgubackend.service.AuthService;
import com.sikgu.sikgubackend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;

    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest signupRequest) {
        if (authService.signup(signupRequest)) {
            return ResponseEntity.ok("회원가입이 성공적으로 완료되었습니다.");
        }
        return ResponseEntity.badRequest().body("회원가입 실패.");
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);

        return ResponseEntity.ok().body(response);
    }

    @Operation(summary = "내 정보 조회 (JWT 기반)")
    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        UserDto user = authService.getUserProfile(email);

        return ResponseEntity.ok(user);
    }

    @Operation(summary = "로그아웃(토큰 무효화)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {

        // 1. Bearer 접두사 체크 및 길이 확인
        if (authHeader == null || !authHeader.startsWith("Bearer ") || authHeader.length() <= 7) {
            // 400 Bad Request 반환
            return ResponseEntity.badRequest().build();
        }

        // 2. 안전하게 JWT 추출
        String jwt = authHeader.substring(7);

        // 3. 추출된 JWT가 비어있는지 체크
        if (jwt.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        authService.logout(jwt);
        return ResponseEntity.ok().build();
    }
}
