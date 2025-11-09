package com.sikgu.sikgubackend.controller;

import com.sikgu.sikgubackend.dto.SubscriptionPaymentRequest;
import com.sikgu.sikgubackend.dto.SubscriptionResponse;
import com.sikgu.sikgubackend.entity.Subscription;
import com.sikgu.sikgubackend.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @Operation(summary = "구독 생성 및 결제 처리 (더미)")
    @PostMapping
    public ResponseEntity<SubscriptionResponse> createSubscription(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SubscriptionPaymentRequest request) {

        String email = userDetails.getUsername();

        Subscription subscription = subscriptionService.createSubscription(email, request);

        SubscriptionResponse response = new SubscriptionResponse(subscription);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}