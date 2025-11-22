package com.edu.readle.repository;

import com.edu.readle.entity.WordSSAAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WordSSAAttemptRepository extends JpaRepository<WordSSAAttemptEntity, Long> {
    List<WordSSAAttemptEntity> findByUser_UserId(Long userId);
    Optional<WordSSAAttemptEntity> findTopByUser_UserIdAndWssa_WssaIDOrderByAttemptedAtDesc(Long userId, Long wssaId);
    int countByUser_UserIdAndWssa_WssaID(Long userId, Long wssaId);
}

