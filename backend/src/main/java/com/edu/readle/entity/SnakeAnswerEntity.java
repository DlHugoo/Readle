package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class SnakeAnswerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long answerID;

    private String answer;

    private boolean correct;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private SnakeQuestionEntity question;

    // Constructors
    public SnakeAnswerEntity() {}

    public SnakeAnswerEntity(String answer, boolean correct) {
        this.answer = answer;
        this.correct = correct;
    }

    // Getters and Setters
    public Long getAnswerID() {
        return answerID;
    }

    public void setAnswerID(Long answerID) {
        this.answerID = answerID;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public SnakeQuestionEntity getQuestion() {
        return question;
    }

    public void setQuestion(SnakeQuestionEntity question) {
        this.question = question;
    }
}
