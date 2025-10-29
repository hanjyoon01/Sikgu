//package com.sikgu.sikgubackend.entity;
//
//import com.sikgu.sikgubackend.entity.base.BaseEntity;
//import jakarta.persistence.*;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//
//import lombok.*;
//
//@Getter
//@NoArgsConstructor(access = AccessLevel.PROTECTED)
//@Entity
//@Table(name = "reminder")
//public class Reminder extends BaseEntity {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "user_id")
//    private User user;
//
////    @ManyToOne(fetch = FetchType.LAZY)
////    @JoinColumn(name = "plant_id")
////    private Plant plant;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "subscription_id")
//    private Subscription subscription;
//
//    private Integer cycle;
//
//    // TODO
//    private LocalDate nextDate;
//
//    public static Reminder createReminder(User user, Subscription subscription, int cycle) {
//        Reminder reminder = new Reminder();
//        reminder.user = user;
//        reminder.subscription = subscription;
//        reminder.cycle = cycle;
//        return reminder;
//    }
//}
