package com.sikgu.sikgubackend.service;

import com.sikgu.sikgubackend.dto.SubscriptionPaymentRequest;
import com.sikgu.sikgubackend.entity.Subscription;
import com.sikgu.sikgubackend.entity.User;
import com.sikgu.sikgubackend.repository.SubscriptionRepository;
import com.sikgu.sikgubackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    // 더미 결제를 위한 성공 가능 카드 목록 (실제 서비스에서는 DB/PG사 연동 필요)
    private static final List<String> SUCCESS_CARDS = List.of(
            "1234567812345678",
            "0000000000000000"
    );

    // 더미 결제용 임시 plan 가격
    private Long getPlanPrice(Long planId) {
        if (planId == 1L) return 4900L;
        if (planId == 2L) return 9900L;
        throw new IllegalArgumentException("존재하지 않는 구독 플랜 ID입니다.");
    }

    @Transactional
    public Subscription createSubscription(String email, SubscriptionPaymentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        Long planPrice = getPlanPrice(request.getPlanId());

        if (!isPaymentSuccessful(request)) {
            throw new IllegalArgumentException("결제 정보가 유효하지 않거나 결제에 실패했습니다.");
        }

        Subscription newSubscription = Subscription.builder()
                .user(user)
                .planId(request.getPlanId())
                .paidAmount(planPrice)
                .build();

        return subscriptionRepository.save(newSubscription);
    }

    private boolean isPaymentSuccessful(SubscriptionPaymentRequest request) {
        String cleanedCardNumber = request.getCardNumber().replaceAll("[^0-9]", "");

        if (!"123".equals(request.getCvc())) {
            return false;
        }

        return SUCCESS_CARDS.contains(cleanedCardNumber);
    }
}