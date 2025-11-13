package com.sikgu.sikgubackend.repository;

import com.sikgu.sikgubackend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // 토큰 값으로 엔티티를 찾는 쿼리 메서드
    Optional<PasswordResetToken> findByToken(String token);
}