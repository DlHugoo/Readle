package com.edu.readle.service;

import com.edu.readle.dto.SnakeAnswerDTO;
import com.edu.readle.dto.SnakeQuestionDTO;
import com.edu.readle.entity.SnakeAnswerEntity;
import com.edu.readle.entity.SnakeQuestionEntity;
import com.edu.readle.repository.SnakeQuestionRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SnakeQuestionService {

    private final SnakeQuestionRepository snakeQuestionRepository;

    public SnakeQuestionService(SnakeQuestionRepository snakeQuestionRepository) {
        this.snakeQuestionRepository = snakeQuestionRepository;
    }

    public SnakeQuestionEntity addQuestion(SnakeQuestionDTO dto) {
        SnakeQuestionEntity question = new SnakeQuestionEntity();
        question.setText(dto.getText());

        for (SnakeAnswerDTO answerDTO : dto.getAnswers()) {
            SnakeAnswerEntity answer = new SnakeAnswerEntity();
            answer.setText(answerDTO.getText());
            answer.setCorrect(answerDTO.isCorrect());
            question.addAnswer(answer);
        }

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
}
