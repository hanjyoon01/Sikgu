package com.sikgu.sikgubackend.entity;

import com.sikgu.sikgubackend.entity.base.BaseEntity;
import com.sikgu.sikgubackend.entity.enums.Size;
import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "pot")
public class Pot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.ORDINAL)
    private Size size;

    private String material;

    private String color;

    public static Pot createPot(String name, Size size, String material, String color) {
        Pot pot = new Pot();
        pot.name = name;
        pot.size = size;
        pot.material = material;
        pot.color = color;
        return pot;
    }
}
