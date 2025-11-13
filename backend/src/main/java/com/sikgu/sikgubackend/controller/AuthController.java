package com.sikgu.sikgubackend.controller;

import com.sikgu.sikgubackend.dto.LoginRequest;
import com.sikgu.sikgubackend.dto.PasswordResetExecution;
import com.sikgu.sikgubackend.dto.PasswordResetRequest;
import com.sikgu.sikgubackend.dto.SignupRequest;
import com.sikgu.sikgubackend.security.jwt.util.JwtTokenUtil;
import com.sikgu.sikgubackend.service.AuthService;
import com.sikgu.sikgubackend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final AuthService authService;

    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest signupRequest) {
        if (userService.signup(signupRequest)) {
            return ResponseEntity.ok("회원가입이 성공적으로 완료되었습니다.");
        }
        return ResponseEntity.badRequest().body("회원가입 실패.");
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtTokenUtil.generateToken(authentication.getName());

        return ResponseEntity.ok(token);
    }

    @PostMapping("/reset-password-request")
    public ResponseEntity<String> resetPasswordRequest(@RequestBody PasswordResetRequest request) {
         authService.generateResetTokenAndSendEmail(request.getEmail());

        return ResponseEntity.ok("비밀번호 재설정 링크가 이메일로 전송되었습니다.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody PasswordResetExecution execution) {
         authService.resetPassword(execution.getToken(), execution.getNewPassword());

        return ResponseEntity.ok("비밀번호가 성공적으로 재설정되었습니다.");
    }
}