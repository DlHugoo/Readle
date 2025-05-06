package com.edu.readle.repository;

import com.edu.readle.entity.Story;
import com.edu.readle.entity.UserAttempt;
import com.edu.readle.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAttemptRepository extends JpaRepository<UserAttempt, Long> {
    List<UserAttempt> findByUser(UserEntity user);
    List<UserAttempt> findByStory(Story story);
    Optional<UserAttempt> findByUserAndStory(UserEntity user, Story story);
}