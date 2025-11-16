package com.sikgu.sikgubackend.entity;

import com.sikgu.sikgubackend.entity.base.BaseEntity;
import com.sikgu.sikgubackend.entity.enums.Category;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "support_qna")
public class SupportQnA extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.ORDINAL)
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    private LocalDateTime createdAt;

    public static SupportQnA createSupportQnA(User user, Category category, String question, String answer) {
        SupportQnA supportQnA = new SupportQnA();
        supportQnA.user = user;
        supportQnA.category = category;
        supportQnA.question = question;
        supportQnA.answer = answer;
        supportQnA.createdAt = LocalDateTime.now();
        return supportQnA;
    }
}
