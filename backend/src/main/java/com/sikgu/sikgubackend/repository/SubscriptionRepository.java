package com.sikgu.sikgubackend.repository;

import com.sikgu.sikgubackend.entity.Subscription;
import com.sikgu.sikgubackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUserAndPaymentStatus(User user, String success);
}
