package com.sikgu.sikgubackend.repository;

import com.sikgu.sikgubackend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * 사용자 이메일을 통해 장바구니 정보를 조회합니다.
     * Eager 로딩이 필요할 경우 Fetch Join을 사용할 수 있지만, 여기서는 간결하게 작성합니다.
     */
    @Query("SELECT c FROM Cart c JOIN c.user u WHERE u.email = :email")
    Optional<Cart> findByUserEmail(@Param("email") String email);
}