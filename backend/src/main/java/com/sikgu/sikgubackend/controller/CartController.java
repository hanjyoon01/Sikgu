package com.sikgu.sikgubackend.controller;

import com.sikgu.sikgubackend.dto.CartDto;
import com.sikgu.sikgubackend.dto.CartItemAddRequest;
import com.sikgu.sikgubackend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/carts")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @Operation(summary = "장바구니 정보 조회")
    @GetMapping // GET /carts
    public ResponseEntity<CartDto> getShoppingCart(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        CartDto cartDto = cartService.getShoppingCart(email);
        return ResponseEntity.ok(cartDto);
    }

    @Operation(summary = "장바구니 항목 추가 (수량 1개씩)")
    @PostMapping // POST /carts
    public ResponseEntity<CartDto> addItemToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CartItemAddRequest request) {

        String email = userDetails.getUsername();
        CartDto updatedCart = cartService.addItemToCart(email, request);
        return ResponseEntity.ok(updatedCart);
    }

    @Operation(summary = "특정 식물의 수량을 1 감소")
    @PatchMapping("/{plantId}/quantity") // PATCH /carts/{plantId}/quantity
    public ResponseEntity<CartDto> decreaseItemQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long plantId) {

        String email = userDetails.getUsername();
        CartDto updatedCart = cartService.decreaseItemQuantity(email, plantId);
        return ResponseEntity.ok(updatedCart);
    }

    @Operation(summary = "장바구니에서 특정 식물 항목 전체 제거")
    @DeleteMapping("/{plantId}") // DELETE /carts/{plantId}
    public ResponseEntity<CartDto> removeItemFromCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long plantId) {

        String email = userDetails.getUsername();
        CartDto updatedCart = cartService.removeItemFromCart(email, plantId);
        return ResponseEntity.ok(updatedCart);
    }

    @Operation(summary = "장바구니 전체 비우기")
    @DeleteMapping // DELETE /carts
    public ResponseEntity<CartDto> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        CartDto updatedCart = cartService.clearCart(email);
        return ResponseEntity.ok(updatedCart);
    }
}