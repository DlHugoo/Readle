package com.edu.readle.repository;

import com.edu.readle.entity.PredictionCheckpointAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PredictionCheckpointAttemptRepository extends JpaRepository<PredictionCheckpointAttemptEntity, Long> {
    List<PredictionCheckpointAttemptEntity> findByUser_UserId(Long userId);
    List<PredictionCheckpointAttemptEntity> findByCheckpoint_CheckpointId(Long checkpointId);
    Optional<PredictionCheckpointAttemptEntity> findTopByUser_UserIdAndCheckpoint_CheckpointIdOrderByAttemptedAtDesc(Long userId, Long checkpointId);
    long countByUser_UserIdAndCheckpoint_CheckpointId(Long userId, Long checkpointId);
}