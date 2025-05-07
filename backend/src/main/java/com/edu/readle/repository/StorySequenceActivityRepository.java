package com.edu.readle.repository;

import com.edu.readle.entity.StorySequenceActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StorySequenceActivityRepository extends JpaRepository<StorySequenceActivityEntity, Long> {
    Optional<StorySequenceActivityEntity> findByBook_BookID(Long bookId);
}
