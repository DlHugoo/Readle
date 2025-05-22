package com.edu.readle.controller;

import com.edu.readle.entity.PredictionCheckpointAttemptEntity;
import com.edu.readle.service.PredictionCheckpointAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Add these imports at the top
import com.edu.readle.repository.UserRepository;
import com.edu.readle.repository.PredictionCheckpointRepository;
import com.edu.readle.repository.PredictionImageRepository;

@RestController
@RequestMapping("/api/prediction-checkpoint-attempts")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PredictionCheckpointAttemptController {

    @Autowired
    private PredictionCheckpointAttemptService attemptService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PredictionCheckpointRepository checkpointRepository;
    
    @Autowired
    private PredictionImageRepository imageRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PredictionCheckpointAttemptEntity>> getUserAttempts(@PathVariable Long userId) {
        List<PredictionCheckpointAttemptEntity> attempts = attemptService.getAttemptsByUser(userId);
        return ResponseEntity.ok(attempts);
    }

    @GetMapping("/checkpoint/{checkpointId}")
    public ResponseEntity<List<PredictionCheckpointAttemptEntity>> getCheckpointAttempts(@PathVariable Long checkpointId) {
        List<PredictionCheckpointAttemptEntity> attempts = attemptService.getAttemptsByCheckpoint(checkpointId);
        return ResponseEntity.ok(attempts);
    }

    @GetMapping("/user/{userId}/checkpoint/{checkpointId}/latest")
    public ResponseEntity<?> getLatestAttempt(@PathVariable Long userId, @PathVariable Long checkpointId) {
        return attemptService.getLatestAttempt(userId, checkpointId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}/checkpoint/{checkpointId}/count")
    public ResponseEntity<Long> getAttemptCount(@PathVariable Long userId, @PathVariable Long checkpointId) {
        long count = attemptService.getAttemptCount(userId, checkpointId);
        return ResponseEntity.ok(count);
    }

    @PostMapping
    public ResponseEntity<PredictionCheckpointAttemptEntity> createAttempt(
            @RequestParam Long userId,
            @RequestParam Long checkpointId,
            @RequestParam Long selectedImageId,
            @RequestParam boolean isCorrect) {
        
        PredictionCheckpointAttemptEntity attempt = attemptService.saveAttempt(
            userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found")),
            checkpointRepository.findById(checkpointId).orElseThrow(() -> new RuntimeException("Checkpoint not found")),
            imageRepository.findById(selectedImageId).orElseThrow(() -> new RuntimeException("Image not found")),
            isCorrect
        );
        return ResponseEntity.ok(attempt);
    }
}