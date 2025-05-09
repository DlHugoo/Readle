package com.edu.readle.repository;

import com.edu.readle.entity.SSAAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SSAAttemptRepository extends JpaRepository<SSAAttemptEntity, Long> {
    List<SSAAttemptEntity> findByUser_UserId(Long userId);
}
