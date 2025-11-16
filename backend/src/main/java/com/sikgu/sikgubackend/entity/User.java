package com.sikgu.sikgubackend.entity;

import com.sikgu.sikgubackend.entity.base.BaseEntity;
import com.sikgu.sikgubackend.entity.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Column(nullable = false)
    private Integer coins = 0;

    @Column
    private String address;

    @Column
    private String phone;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SupportQnA> supportQnAs = new ArrayList<>();

    public static User createUser(String email, String password) {
        User user = new User();
        user.email = email;
        user.password = password;
        user.role = Role.USER;
        user.coins = 0;
        return user;
    }

    public void updateInfo(String newAddress, String newPhoneNumber) {
        // 유효성 검사 로직 추가 가능

        this.address = newAddress;
        this.phoneNumber = newPhoneNumber;
    }

    public void addReview(Review review) {
        this.reviews.add(review);
        review.setUser(this);
    }
    public void addSupportQnA(SupportQnA supportQnA) {
        this.supportQnAs.add(supportQnA);
        supportQnA.setUser(this);
    }

    public void addCoins(int amount) {
        this.coins += amount;
    }

    public void subtractCoins(int amount) {
        if (this.coins < amount) {
            throw new IllegalArgumentException("보유 코인이 부족합니다.");
        }
        this.coins -= amount;
    }

    public void updateAddress(String address) {
        this.address = address;
    }

    public void updatePhone(String phone) {
        this.phone = phone;
    }
}