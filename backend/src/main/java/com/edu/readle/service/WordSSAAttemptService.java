package com.edu.readle.service;

import com.edu.readle.entity.WordSSAAttemptEntity;
import com.edu.readle.entity.WordStorySequenceActivityEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.WordSSAAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WordSSAAttemptService {

    @Autowired
    private WordSSAAttemptRepository attemptRepository;

    public WordSSAAttemptEntity saveAttempt(UserEntity user, WordStorySequenceActivityEntity wssa, 
                                      List<Long> attemptedSequence, boolean isCorrect) {
        WordSSAAttemptEntity attempt = new WordSSAAttemptEntity(user, wssa, attemptedSequence, isCorrect);
        return attemptRepository.save(attempt);
    }

    public List<WordSSAAttemptEntity> getAttemptsByUser(Long userId) {
        return attemptRepository.findByUser_UserId(userId);
    }

    public Optional<WordSSAAttemptEntity> getLatestAttempt(Long userId, Long wssaId) {
        return attemptRepository.findTopByUser_UserIdAndWssa_WssaIDOrderByAttemptedAtDesc(userId, wssaId);
    }
}

