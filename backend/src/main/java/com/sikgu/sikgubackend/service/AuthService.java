package com.sikgu.sikgubackend.service;

import com.sikgu.sikgubackend.entity.PasswordResetToken;
import com.sikgu.sikgubackend.entity.User;
import com.sikgu.sikgubackend.repository.PasswordResetTokenRepository;
import com.sikgu.sikgubackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    // 이메일 서비스는 구현의 편의를 위해 mock한다고 가정합니다.
    // private final EmailService emailService;

    private static final int EXPIRATION_MINUTES = 30; // 토큰 만료 시간 (30분)

    // ------------------------------------------------------------------------------------------------------
    // A. Step 1: Reset Token 발급 및 Email 전송 요청
    // ------------------------------------------------------------------------------------------------------
    @Transactional
    public void generateResetTokenAndSendEmail(String email) {

        // 1. User 존재 확인
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다."));

        // 2. 💡 기존 토큰 삭제 (토큰은 1회 사용 또는 1개만 유효)
        tokenRepository.findByToken(user.getEmail()).ifPresent(tokenRepository::delete);

        // 3. 💡 새로운 Token 생성 및 만료 시간 설정
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES);

        PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);
        tokenRepository.save(resetToken);

        // 4. Reset Link 생성 및 Email 전송 (Mock)
        String resetUrl = "http://your-frontend/reset-page?token=" + token;
        // emailService.sendResetPasswordEmail(user.getEmail(), resetUrl);

        System.out.println("DEBUG: Password Reset Link sent to " + email + ": " + resetUrl);
    }

    // ------------------------------------------------------------------------------------------------------
    // B. Step 2: Password Reset 실행
    // ------------------------------------------------------------------------------------------------------
    @Transactional
    public void resetPassword(String token, String newPassword) {

        // 1. 💡 Token 유효성 검증 (토큰 존재 여부 및 만료 시간 확인)
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 토큰입니다."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken); // 만료된 토큰 정리
            throw new IllegalArgumentException("토큰이 만료되었습니다. 재설정 요청을 다시 해주세요.");
        }

        // 2. User 엔티티 조회 및 Password 업데이트
        User user = resetToken.getUser();
        // User 엔티티에 password 업데이트 메소드(setPassword)가 있다고 가정합니다.

        // 🚨 반드시 새 비밀번호를 BCrypt로 해시하여 저장해야 합니다.
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user); // 변경된 Password DB에 저장

        // 3. 💡 사용 완료된 토큰 삭제 (보안: 토큰 재사용 방지)
        tokenRepository.delete(resetToken);
    }
}
// 참고: User 엔티티에 setPassword(String password) 메소드가 있어야 합니다.