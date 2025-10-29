package com.sikgu.sikgubackend.entity;

import com.sikgu.sikgubackend.entity.base.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "planterior3d")
public class Planterior3D extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plant_modeling_url", length = 512)
    private String plantModelingURL;

    private LocalDateTime createdAt;

    public static Planterior3D createPlanterior3D(String url, LocalDateTime createdAt) {
        Planterior3D planterior3D = new Planterior3D();
        planterior3D.plantModelingURL = url;
        planterior3D.createdAt = createdAt;
        return planterior3D;
    }
}