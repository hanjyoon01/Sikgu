package com.sikgu.sikgubackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tests")
public class TestController {

    @Operation(summary = "프론트, 백 연결 테스트")
    @GetMapping
    public ResponseEntity<String> getMyPage() {
        try {
            System.out.println("정상 작동");
            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            System.err.println("작동 실패");
            return ResponseEntity.ok("Failure");
        }
    }
}
