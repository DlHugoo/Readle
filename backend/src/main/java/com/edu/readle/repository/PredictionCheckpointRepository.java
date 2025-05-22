package com.edu.readle.repository;

import com.edu.readle.entity.PredictionCheckpointEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PredictionCheckpointRepository extends JpaRepository<PredictionCheckpointEntity, Long> {
    Optional<PredictionCheckpointEntity> findByBook_BookID(Long bookId);
    List<PredictionCheckpointEntity> findByBook_BookIDAndPageNumberLessThanEqual(Long bookId, Integer pageNumber);
}