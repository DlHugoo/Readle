package com.edu.readle.controller;

import com.edu.readle.dto.SnakeQuestionDTO;
import com.edu.readle.entity.SnakeQuestionEntity;
import com.edu.readle.service.SnakeQuestionService;
import org.springframework.http.ResponseEntity;
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

    @PostMapping
    public ResponseEntity<SnakeQuestionEntity> addQuestion(@RequestBody SnakeQuestionDTO dto) {
        return ResponseEntity.ok(snakeQuestionService.addQuestion(dto));
    }

    @GetMapping
    public ResponseEntity<List<SnakeQuestionEntity>> getAllQuestions() {
        return ResponseEntity.ok(snakeQuestionService.getAllQuestions());
    }

    @GetMapping("/random")
    public ResponseEntity<List<SnakeQuestionEntity>> getRandomQuestions(@RequestParam(defaultValue = "5") int count) {
        return ResponseEntity.ok(snakeQuestionService.getRandomQuestions(count));
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<SnakeQuestionEntity>> getQuestionsByBookId(@PathVariable Long bookId) {
        return ResponseEntity.ok(snakeQuestionService.getQuestionsByBookId(bookId));
    }
}
