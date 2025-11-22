package com.edu.readle.repository;

import com.edu.readle.entity.WordStorySequenceActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WordStorySequenceActivityRepository extends JpaRepository<WordStorySequenceActivityEntity, Long> {
    Optional<WordStorySequenceActivityEntity> findByBook_BookID(Long bookId);
}

