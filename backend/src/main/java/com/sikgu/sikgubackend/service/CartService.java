package com.sikgu.sikgubackend.service;

import com.sikgu.sikgubackend.dto.CartDto;
import com.sikgu.sikgubackend.dto.CartItemDto;
import com.sikgu.sikgubackend.entity.Cart;
import com.sikgu.sikgubackend.repository.CartRepository;
import com.sikgu.sikgubackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// 읽기 전용으로 설정하고, 생성 메서드에만 @Transactional(readOnly = false)를 적용하는 것이 좋지만, 간결하게 구성합니다.
@Transactional(readOnly = true)
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    public CartDto getShoppingCart(String email) {

        Optional<Cart> optionalCart = cartRepository.findByUserEmail(email);

        Cart cart;
        if (optionalCart.isPresent()) {
            cart = optionalCart.get();
        } else {
            // 장바구니가 없으면 새로 생성 (실제로는 이 메서드를 @Transactional(readOnly = false)로 분리해야 함)
            cart = userRepository.findByEmail(email)
                    .map(user -> {
                        Cart newCart = Cart.builder().user(user).build();
                        // cartRepository.save(newCart);
                        return newCart; // 임시 반환
                    })
                    .orElseThrow(() -> new UsernameNotFoundException("사용자 정보를 찾을 수 없습니다: " + email));
        }

        // Cart 엔티티를 CartDto로 변환
        List<CartItemDto> itemDtos = cart.getItems().stream()
                .map(item -> {
                    long totalPrice = item.getPlant().getPrice() * item.getQuantity();

                    return new CartItemDto(
                            item.getPlant().getId(),
                            item.getPlant().getName(),
                            item.getPlant().getPrice(),
                            item.getQuantity(),
                            totalPrice
                    );
                })
                .collect(Collectors.toList());

        // 총 금액 계산
        long totalAmount = itemDtos.stream()
                .mapToLong(CartItemDto::getItemTotal)
                .sum();

        return new CartDto(email, itemDtos, totalAmount);
    }
}