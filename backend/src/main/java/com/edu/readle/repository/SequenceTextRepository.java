package com.edu.readle.repository;

import com.edu.readle.entity.SequenceTextEntity;
import com.edu.readle.entity.WordStorySequenceActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SequenceTextRepository extends JpaRepository<SequenceTextEntity, Long> {
    List<SequenceTextEntity> findByWssaOrderByCorrectPosition(WordStorySequenceActivityEntity wssa);
}

