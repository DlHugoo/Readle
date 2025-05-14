package com.edu.readle.controller;

import com.edu.readle.entity.SnakeGameAttemptEntity;
import com.edu.readle.service.SnakeGameAttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edu.readle.entity.BookEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/snake-attempts")
public class SnakeGameAttemptController {

    private final SnakeGameAttemptService snakeGameAttemptService;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    // ✅ Constructor injection for repositories and services
    public SnakeGameAttemptController(SnakeGameAttemptService snakeGameAttemptService,
                                      UserRepository userRepository,
                                      BookRepository bookRepository) {
        this.snakeGameAttemptService = snakeGameAttemptService;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    // Endpoint to create a new SnakeGameAttempt for a specific user and book
@PostMapping
public ResponseEntity<SnakeGameAttemptEntity> createAttempt(
        @RequestParam Long userId,
        @RequestParam Long bookId,
        @RequestParam int score) {

    // Fetch the user and book from the database
    UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    BookEntity book = bookRepository.findById(bookId)
            .orElseThrow(() -> new RuntimeException("Book not found"));

    // Create a new SnakeGameAttemptEntity
    SnakeGameAttemptEntity attempt = new SnakeGameAttemptEntity();
    attempt.setUser(user);
    attempt.setBook(book);
    attempt.setScore(score);
    attempt.setAttemptTime(java.time.LocalDateTime.now());

    SnakeGameAttemptEntity savedAttempt = snakeGameAttemptService.save(attempt);
    return new ResponseEntity<>(savedAttempt, HttpStatus.CREATED);
}

    // Endpoint to get all SnakeGameAttempts for a specific user and book
    @GetMapping("/user/{userId}/book/{bookId}")
    public ResponseEntity<List<SnakeGameAttemptEntity>> getAttemptsByUserAndBook(
            @PathVariable Long userId, 
            @PathVariable Long bookId) {
        
        List<SnakeGameAttemptEntity> attempts = snakeGameAttemptService.findByUserIdAndBookId(userId, bookId);
        return new ResponseEntity<>(attempts, HttpStatus.OK);
    }

    // ✅ Endpoint to count the number of attempts by user and book
@GetMapping("/user/{userId}/book/{bookId}/count")
public ResponseEntity<Long> countAttemptsByUserAndBook(
        @PathVariable Long userId,
        @PathVariable Long bookId) {

    long count = snakeGameAttemptService.countByUserIdAndBookId(userId, bookId);
    return ResponseEntity.ok(count);
}


    // Endpoint to get a SnakeGameAttempt by ID
    @GetMapping("/{id}")
    public ResponseEntity<SnakeGameAttemptEntity> getAttemptById(@PathVariable Long id) {
        Optional<SnakeGameAttemptEntity> attempt = snakeGameAttemptService.findById(id);
        return attempt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Endpoint to delete a SnakeGameAttempt by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttempt(@PathVariable Long id) {
        Optional<SnakeGameAttemptEntity> attempt = snakeGameAttemptService.findById(id);
        if (attempt.isPresent()) {
            snakeGameAttemptService.deleteById(id);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
