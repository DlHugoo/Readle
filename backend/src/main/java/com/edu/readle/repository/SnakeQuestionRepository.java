package com.edu.readle.repository;

import com.edu.readle.entity.SnakeQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import java.util.*;

@Repository
public interface SnakeQuestionRepository extends JpaRepository<SnakeQuestionEntity, Long> {
    List<SnakeQuestionEntity> findByBook_bookID(Long bookId);
}
