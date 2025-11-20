package com.sikgu.sikgubackend.service;

import com.sikgu.sikgubackend.security.jwt.util.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    // JWT 블랙리스트 (Set을 사용하고 동기화 처리)
    private final Set<String> blacklist = Collections.synchronizedSet(new HashSet<>());
    private final JwtTokenUtil jwtTokenUtil;

    // 토큰을 블랙리스트에 등록 (JWT의 남은 유효기간 동안만 저장)
    public void blacklistToken(String token) {
        if (token == null || isBlacklisted(token)) {
            return;
        }

        // 토큰의 남은 유효 시간 계산 (초 단위)
        long remainingTimeSeconds = jwtTokenUtil.getRemainingTimeSeconds(token);

        if (remainingTimeSeconds > 0) {
            blacklist.add(token);
            // 유효기간이 지나면 자동으로 블랙리스트에서 제거되도록 스케줄링
            scheduleRemoval(token, remainingTimeSeconds);
        }
    }

    // 토큰이 블랙리스트에 있는지 확인
    public boolean isBlacklisted(String token) {
        boolean isBlacklisted = blacklist.contains(token);
        if (isBlacklisted) {
            log.warn("BLOCKED ACCESS: Token found in blacklist.");
        }
        return isBlacklisted;}

    // 유효기간이 지나면 블랙리스트에서 토큰을 제거하는 로직
    private void scheduleRemoval(String token, long delaySeconds) {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.schedule(() -> {
            blacklist.remove(token);
            scheduler.shutdown();
        }, delaySeconds, TimeUnit.SECONDS);
    }
}