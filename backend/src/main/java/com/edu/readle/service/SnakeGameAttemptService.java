package com.edu.readle.service;

import com.edu.readle.entity.SnakeGameAttemptEntity;
import com.edu.readle.repository.SnakeGameAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SnakeGameAttemptService {

    private final SnakeGameAttemptRepository snakeGameAttemptRepository;

    @Autowired
    public SnakeGameAttemptService(SnakeGameAttemptRepository snakeGameAttemptRepository) {
        this.snakeGameAttemptRepository = snakeGameAttemptRepository;
    }

    // Save a new SnakeGameAttempt
    public SnakeGameAttemptEntity save(SnakeGameAttemptEntity attempt) {
        return snakeGameAttemptRepository.save(attempt);
    }

    // Find all attempts
    public List<SnakeGameAttemptEntity> findAll() {
        return snakeGameAttemptRepository.findAll();
    }

    // Find an attempt by ID
    public Optional<SnakeGameAttemptEntity> findById(Long id) {
        return snakeGameAttemptRepository.findById(id);
    }

    // Find attempts by userId and bookId
    public List<SnakeGameAttemptEntity> findByUserIdAndBookId(Long userId, Long bookId) {
        return snakeGameAttemptRepository.findAll().stream()
                .filter(attempt -> attempt.getUser().getId().equals(userId) && attempt.getBook().getBookID().equals(bookId))
                .toList();
    }

    // Delete an attempt by ID
    public void deleteById(Long id) {
        snakeGameAttemptRepository.deleteById(id);
    }

public long countByUserIdAndBookId(Long userId, Long bookId) {
    return snakeGameAttemptRepository.countByUser_IdAndBook_BookID(userId, bookId);
}
}
