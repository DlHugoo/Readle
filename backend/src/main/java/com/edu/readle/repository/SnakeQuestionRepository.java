package com.edu.readle.repository;

import com.edu.readle.entity.SnakeQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SnakeQuestionRepository extends JpaRepository<SnakeQuestionEntity, Long> {
}
