package com.sikgu.sikgubackend.entity;

import com.sikgu.sikgubackend.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "subscribed_plant")
public class SubscribedPlant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    private Plant plant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pot_id")
    private Pot pot;

    private Integer quantity;

    public static SubscribedPlant createSubscribedPlant(Subscription subscription, Plant plant, Pot pot, int quantity) {
        SubscribedPlant subscribedPlant = new SubscribedPlant();
        subscribedPlant.subscription = subscription;
        subscribedPlant.plant = plant;
        subscribedPlant.pot = pot;
        subscribedPlant.quantity = quantity;
        return subscribedPlant;
    }
}
