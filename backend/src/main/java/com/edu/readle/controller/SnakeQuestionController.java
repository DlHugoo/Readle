package com.edu.readle.controller;

import com.edu.readle.dto.SnakeQuestionDTO;
import com.edu.readle.entity.SnakeQuestionEntity;
import com.edu.readle.service.SnakeQuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/snake-questions")
public class SnakeQuestionController {

    private final SnakeQuestionService snakeQuestionService;

    public SnakeQuestionController(SnakeQuestionService snakeQuestionService) {
        this.snakeQuestionService = snakeQuestionService;
    }

    // 🔐 Add a new snake question
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PostMapping
    public ResponseEntity<SnakeQuestionEntity> addQuestion(@RequestBody SnakeQuestionDTO dto) {
        return ResponseEntity.ok(snakeQuestionService.addQuestion(dto));
    }

    // 🔐 Get all questions (could restrict this more if needed)
    @GetMapping
    public ResponseEntity<List<SnakeQuestionEntity>> getAllQuestions() {
        return ResponseEntity.ok(snakeQuestionService.getAllQuestions());
    }

    // 🔐 Get random questions (e.g. for games or preview)
    @GetMapping("/random")
    public ResponseEntity<List<SnakeQuestionEntity>> getRandomQuestions(@RequestParam(defaultValue = "5") int count) {
        return ResponseEntity.ok(snakeQuestionService.getRandomQuestions(count));
    }

    // 🔐 Get questions by book ID
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<SnakeQuestionEntity>> getQuestionsByBookId(@PathVariable Long bookId) {
        return ResponseEntity.ok(snakeQuestionService.getQuestionsByBookId(bookId));
    }

    // 🔐 Update a question
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PutMapping("/{questionId}")
    public ResponseEntity<SnakeQuestionEntity> updateQuestion(@PathVariable Long questionId, @RequestBody SnakeQuestionDTO dto) {
        return ResponseEntity.ok(snakeQuestionService.updateQuestion(questionId, dto));
    }
}
