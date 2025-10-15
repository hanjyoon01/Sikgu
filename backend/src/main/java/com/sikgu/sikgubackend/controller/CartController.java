package com.sikgu.sikgubackend.controller;

import com.sikgu.sikgubackend.dto.CartDto;
import com.sikgu.sikgubackend.dto.CartItemAddRequest;
import com.sikgu.sikgubackend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/carts")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @Operation(summary = "장바구니 정보 조회")
    @GetMapping // GET /carts
    public ResponseEntity<CartDto> getShoppingCart(@AuthenticationPrincipal UserDetails userDetails) {
        // @AuthenticationPrincipal을 사용해 현재 로그인한 사용자 정보를 가져옵니다.
        String email = userDetails.getUsername();

        // CartService를 호출하여 장바구니 DTO를 반환
        CartDto cartDto = cartService.getShoppingCart(email);

        return ResponseEntity.ok(cartDto);
    }

    @Operation(summary = "장바구니 항목 추가")
    @PostMapping // POST /carts
    public ResponseEntity<CartDto> addItemToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CartItemAddRequest request) {

        String email = userDetails.getUsername();

        // 항목 추가 로직 실행 후 업데이트된 장바구니 정보 반환
        CartDto updatedCart = cartService.addItemToCart(email, request);

        return ResponseEntity.ok(updatedCart);
    }
}