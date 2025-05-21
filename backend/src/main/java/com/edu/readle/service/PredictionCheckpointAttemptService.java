package com.edu.readle.service;

import com.edu.readle.entity.PredictionCheckpointAttemptEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.entity.PredictionCheckpointEntity;
import com.edu.readle.entity.PredictionImageEntity;
import com.edu.readle.repository.PredictionCheckpointAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PredictionCheckpointAttemptService {

    @Autowired
    private PredictionCheckpointAttemptRepository attemptRepository;

    public PredictionCheckpointAttemptEntity saveAttempt(UserEntity user, 
                                                        PredictionCheckpointEntity checkpoint,
                                                        PredictionImageEntity selectedImage,
                                                        boolean isCorrect) {
        PredictionCheckpointAttemptEntity attempt = new PredictionCheckpointAttemptEntity();
        attempt.setUser(user);
        attempt.setCheckpoint(checkpoint);
        attempt.setSelectedImage(selectedImage);
        attempt.setCorrect(isCorrect);
        attempt.setAttemptedAt(LocalDateTime.now());
        return attemptRepository.save(attempt);
    }

    public List<PredictionCheckpointAttemptEntity> getAttemptsByUser(Long userId) {
        return attemptRepository.findByUser_UserId(userId);
    }

    public List<PredictionCheckpointAttemptEntity> getAttemptsByCheckpoint(Long checkpointId) {
        return attemptRepository.findByCheckpoint_CheckpointId(checkpointId);
    }

    public Optional<PredictionCheckpointAttemptEntity> getLatestAttempt(Long userId, Long checkpointId) {
        return attemptRepository.findTopByUser_UserIdAndCheckpoint_CheckpointIdOrderByAttemptedAtDesc(userId, checkpointId);
    }

    public long getAttemptCount(Long userId, Long checkpointId) {
        return attemptRepository.countByUser_UserIdAndCheckpoint_CheckpointId(userId, checkpointId);
    }
}