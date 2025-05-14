package com.edu.readle.repository;

import com.edu.readle.entity.SnakeGameAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SnakeGameAttemptRepository extends JpaRepository<SnakeGameAttemptEntity, Long> {
    // You can add custom queries if needed, such as finding attempts by user and book

    long countByUser_IdAndBook_BookID(Long userId, Long bookId);
}
