package com.sikgu.sikgubackend.repository;

import com.sikgu.sikgubackend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    @Query("SELECT c FROM Cart c JOIN c.user u WHERE u.email = :email")
    Optional<Cart> findByUserEmail(@Param("email") String email);
}