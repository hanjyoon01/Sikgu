package com.sikgu.sikgubackend.entity;

import com.sikgu.sikgubackend.entity.base.BaseEntity;
import com.sikgu.sikgubackend.entity.enums.PlantCondition;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "plant")
public class Plant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    //필요 코인
    private Long price;

    private Long cycle;

    @Enumerated(EnumType.ORDINAL)
    private PlantCondition light;

    @Enumerated(EnumType.ORDINAL)
    private PlantCondition humidity;

    @Enumerated(EnumType.ORDINAL)
    private PlantCondition temp;

    @Column(columnDefinition = "TEXT")
    private String caution;

    @Column(name = "plant_image_url", length = 512)
    private String plantImageURL;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planterior3D_id")
    private Planterior3D planterior3D;

    @OneToMany(mappedBy = "plant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    public static Plant createPlant(String name, long price, long cycle, PlantCondition light, PlantCondition humidity, PlantCondition temp, String caution, String url, Planterior3D planterior3D) {
        Plant plant = new Plant();
        plant.name = name;
        plant.price = price;
        plant.cycle = cycle;
        plant.light = light;
        plant.humidity = humidity;
        plant.temp = temp;
        plant.caution = caution;
        plant.plantImageURL = url;
        plant.planterior3D = planterior3D;
        return plant;
    }

    public void addCartItem(CartItem cartItem) {
        items.add(cartItem);
        cartItem.setPlant(this);
    }
}