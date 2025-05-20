package com.edu.readle.service;

import com.edu.readle.entity.SSAAttemptEntity;
import com.edu.readle.entity.StorySequenceActivityEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.SSAAttemptRepository;
import com.edu.readle.repository.StorySequenceActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SSAAttemptService {

    @Autowired
    private SSAAttemptRepository attemptRepository;

    @Autowired
    private StorySequenceActivityRepository ssaRepository;

    public SSAAttemptEntity saveAttempt(UserEntity user, StorySequenceActivityEntity ssa, 
                                      List<Long> attemptedSequence, boolean isCorrect) {
        SSAAttemptEntity attempt = new SSAAttemptEntity(user, ssa, attemptedSequence, isCorrect);
        return attemptRepository.save(attempt);
    }

    public List<SSAAttemptEntity> getAttemptsByUser(Long userId) {
        return attemptRepository.findByUser_UserId(userId);
    }

    public Optional<SSAAttemptEntity> getLatestAttempt(Long userId, Long ssaId) {
        return attemptRepository.findTopByUser_UserIdAndSsa_SsaIDOrderByAttemptedAtDesc(userId, ssaId);
    }
    
    public int getAttemptCountForBook(Long userId, Long bookId) {
        // First find the SSA for this book
        Optional<StorySequenceActivityEntity> ssaOpt = ssaRepository.findByBook_BookID(bookId);
        
        if (ssaOpt.isEmpty()) {
            return 0; // No SSA exists for this book
        }
        
        StorySequenceActivityEntity ssa = ssaOpt.get();
        
        // Count attempts for this user and SSA
        return attemptRepository.countByUser_UserIdAndSsa_SsaID(userId, ssa.getSsaID());
    }
}