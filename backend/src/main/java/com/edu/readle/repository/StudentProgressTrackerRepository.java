package com.edu.readle.repository;

import com.edu.readle.entity.StudentProgressTracker;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProgressTrackerRepository extends JpaRepository<StudentProgressTracker, Long> {
    
    List<StudentProgressTracker> findByUser(UserEntity user);
    
    List<StudentProgressTracker> findByUserAndIsCompleted(UserEntity user, boolean isCompleted);
    
    Optional<StudentProgressTracker> findByUserAndBook(UserEntity user, BookEntity book);
    
    @Query("SELECT spt FROM StudentProgressTracker spt WHERE spt.user = :user AND spt.isCompleted = true ORDER BY spt.endTime DESC")
    List<StudentProgressTracker> findCompletedBooksByUser(@Param("user") UserEntity user);
    
    @Query("SELECT spt FROM StudentProgressTracker spt WHERE spt.user = :user AND spt.isCompleted = false ORDER BY spt.lastReadAt DESC")
    List<StudentProgressTracker> findInProgressBooksByUser(@Param("user") UserEntity user);
    
    @Query("SELECT COUNT(spt) FROM StudentProgressTracker spt WHERE spt.user = :user AND spt.isCompleted = true")
    Long countCompletedBooksByUser(@Param("user") UserEntity user);
    
    @Query("SELECT COUNT(spt) FROM StudentProgressTracker spt WHERE spt.user = :user AND spt.isCompleted = false")
    Long countInProgressBooksByUser(@Param("user") UserEntity user);
} 