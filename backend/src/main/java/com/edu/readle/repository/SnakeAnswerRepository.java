package com.edu.readle.repository;

import com.edu.readle.entity.SnakeAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SnakeAnswerRepository extends JpaRepository<SnakeAnswerEntity, Long> {
}
