package com.edu.readle.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
public class SnakeQuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long questionID;

    private String text;

    @JsonManagedReference
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SnakeAnswerEntity> answers = new ArrayList<>();

    // Constructors
    public SnakeQuestionEntity() {}

    public SnakeQuestionEntity(String text) {
        this.text = text;
    }

    // Add helper
    public void addAnswer(SnakeAnswerEntity answer) {
        answer.setQuestion(this);
        this.answers.add(answer);
    }

    // Getters and Setters
    public Long getQuestionID() {
        return questionID;
    }

    public void setQuestionID(Long questionID) {
        this.questionID = questionID;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<SnakeAnswerEntity> getAnswers() {
        return answers;
    }

    public void setAnswers(List<SnakeAnswerEntity> answers) {
        this.answers = answers;
    }
}
