package com.edu.readle.service;

import com.edu.readle.dto.SnakeQuestionDTO;
import com.edu.readle.entity.BookEntity;
import com.edu.readle.entity.SnakeAnswerEntity;
import com.edu.readle.entity.SnakeQuestionEntity;
import com.edu.readle.repository.BookRepository;
import com.edu.readle.repository.SnakeQuestionRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SnakeQuestionService {

    private final SnakeQuestionRepository snakeQuestionRepository;
    private final BookRepository bookRepository;

    public SnakeQuestionService(SnakeQuestionRepository snakeQuestionRepository, BookRepository bookRepository) {
        this.snakeQuestionRepository = snakeQuestionRepository;
        this.bookRepository = bookRepository;
    }

    public SnakeQuestionEntity addQuestion(SnakeQuestionDTO dto) {
        SnakeQuestionEntity question = new SnakeQuestionEntity();
        question.setText(dto.getText());

        // Fetch the BookEntity using the bookId from DTO
        BookEntity book = bookRepository.findById(dto.getBookId())
            .orElseThrow(() -> new RuntimeException("Book not found with ID: " + dto.getBookId()));

        question.setBook(book); // ⬅ Associate the book with the question

        // Create and add the answer
        SnakeAnswerEntity answer = new SnakeAnswerEntity();
        answer.setAnswer(dto.getAnswer());
        answer.setCorrect(true);
        question.addAnswer(answer);

        return snakeQuestionRepository.save(question);
    }

    public List<SnakeQuestionEntity> getAllQuestions() {
        return snakeQuestionRepository.findAll();
    }

    public List<SnakeQuestionEntity> getRandomQuestions(int count) {
        List<SnakeQuestionEntity> all = snakeQuestionRepository.findAll();
        Collections.shuffle(all);
        return all.stream().limit(count).collect(Collectors.toList());
    }

    public List<SnakeQuestionEntity> getQuestionsByBookId(Long bookId) {
        return snakeQuestionRepository.findByBook_bookID(bookId);
    }

    // Update question and answers method
    public SnakeQuestionEntity updateQuestion(Long questionId, SnakeQuestionDTO dto) {
        SnakeQuestionEntity question = snakeQuestionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found with ID: " + questionId));

        // Update question text
        question.setText(dto.getText());

        // Update book if needed
        if (dto.getBookId() != null) {
            BookEntity book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found with ID: " + dto.getBookId()));
            question.setBook(book);
        }

        // Update the answer
        if (!question.getAnswers().isEmpty()) {
            SnakeAnswerEntity answer = question.getAnswers().get(0); // Assuming only one answer for simplicity
            answer.setAnswer(dto.getAnswer());
            answer.setCorrect(true); // You may modify this condition depending on your needs
        } else {
            // If no answer exists, create a new one
            SnakeAnswerEntity answer = new SnakeAnswerEntity();
            answer.setAnswer(dto.getAnswer());
            answer.setCorrect(true);
            question.addAnswer(answer);
        }

        return snakeQuestionRepository.save(question);
    }
}
