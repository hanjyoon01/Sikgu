package com.sikgu.sikgubackend.repository;

import com.sikgu.sikgubackend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
}