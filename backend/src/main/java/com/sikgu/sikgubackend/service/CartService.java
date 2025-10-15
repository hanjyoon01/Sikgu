package com.sikgu.sikgubackend.service;

import com.sikgu.sikgubackend.dto.CartDto;
import com.sikgu.sikgubackend.dto.CartItemAddRequest;
import com.sikgu.sikgubackend.dto.CartItemDto;
import com.sikgu.sikgubackend.entity.Cart;
import com.sikgu.sikgubackend.entity.CartItem;
import com.sikgu.sikgubackend.entity.Plant;
import com.sikgu.sikgubackend.repository.CartItemRepository;
import com.sikgu.sikgubackend.repository.CartRepository;
import com.sikgu.sikgubackend.repository.PlantRepository;
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
    private final PlantRepository plantRepository;
    private final CartItemRepository cartItemRepository;

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

    /**
     * 장바구니에 식물 항목을 추가합니다.
     * @param email 현재 사용자 이메일
     * @param request 추가할 식물 ID와 수량
     * @return 업데이트된 장바구니 정보 (CartDto)
     */
    @Transactional // 쓰기 작업이므로 @Transactional 설정
    public CartDto addItemToCart(String email, CartItemAddRequest request) {

        // 1. 사용자 및 장바구니 조회 (없으면 생성)
        Cart cart = cartRepository.findByUserEmail(email)
                .orElseGet(() -> {
                    return userRepository.findByEmail(email)
                            .map(user -> cartRepository.save(Cart.builder().user(user).build()))
                            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
                });

        // 2. Plant 정보 조회
        Plant plant = plantRepository.findById(request.getPlantId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 식물 ID입니다: " + request.getPlantId()));

        // 3. 기존 항목 확인 (같은 식물이 이미 담겨 있다면 수량만 증가)
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getPlant().getId().equals(request.getPlantId()))
                .findFirst();

        CartItem cartItem;
        if (existingItem.isPresent()) {
            // 4. 기존 항목이 있으면 수량만 업데이트
            cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
        } else {
            // 5. 새 항목이면 생성 및 장바구니에 추가
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setPlant(plant);
            cartItem.setQuantity(request.getQuantity());
            cart.getItems().add(cartItem); // Cart 엔티티의 컬렉션에도 추가
        }

        // 6. DB 저장 (Cart의 Cascade 설정 덕분에 CartItem도 함께 저장/업데이트됨)
        cartItemRepository.save(cartItem);

        // 7. 업데이트된 장바구니 정보 반환
        return getShoppingCart(email);
    }
}