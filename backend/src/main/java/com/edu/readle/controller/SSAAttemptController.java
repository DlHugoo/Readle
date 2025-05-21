package com.edu.readle.controller;

import com.edu.readle.entity.SSAAttemptEntity;
import com.edu.readle.service.SSAAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ssa-attempts")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class SSAAttemptController {

    @Autowired
    private SSAAttemptService ssaAttemptService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SSAAttemptEntity>> getUserAttempts(@PathVariable Long userId) {
        List<SSAAttemptEntity> attempts = ssaAttemptService.getAttemptsByUser(userId);
        return ResponseEntity.ok(attempts);
    }

    @GetMapping("/user/{userId}/ssa/{ssaId}/latest")
    public ResponseEntity<?> getLatestAttempt(@PathVariable Long userId, @PathVariable Long ssaId) {
        return ssaAttemptService.getLatestAttempt(userId, ssaId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}/book/{bookId}/count")
    public ResponseEntity<Integer> getAttemptCountForBook(@PathVariable Long userId, @PathVariable Long bookId) {
        int count = ssaAttemptService.getAttemptCountForBook(userId, bookId);
        return ResponseEntity.ok(count);
    }
}