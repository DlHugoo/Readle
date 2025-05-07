package com.edu.readle.repository;

import com.edu.readle.entity.SequenceImageEntity;
import com.edu.readle.entity.StorySequenceActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SequenceImageRepository extends JpaRepository<SequenceImageEntity, Long> {
    List<SequenceImageEntity> findBySsaOrderByCorrectPosition(StorySequenceActivityEntity ssa);
}
