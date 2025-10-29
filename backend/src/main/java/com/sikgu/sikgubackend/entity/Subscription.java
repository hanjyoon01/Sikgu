package com.sikgu.sikgubackend.entity;

import com.sikgu.sikgubackend.entity.base.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "subscription")
public class Subscription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    private LocalDate startDate;

    private LocalDate renewDate;

    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubscribedPlant> subscribedPlants = new ArrayList<>();

//    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<Review> reviews = new ArrayList<>();

    public static Subscription createSubscription(User user, Plan plan) {
        Subscription subscription = new Subscription();
        subscription.user = user;
        subscription.plan = plan;
        subscription.startDate = LocalDate.now();
        subscription.renewDate = LocalDate.now().plusMonths(1);
        return subscription;
    }

    public void addSubscribedPlant(SubscribedPlant plant) {
        this.subscribedPlants.add(plant);
        plant.setSubscription(this);
    }

//    public void addReview(Review review) {
//        this.reviews.add(review);
//        review.setSubscription(this);
//    }
}
