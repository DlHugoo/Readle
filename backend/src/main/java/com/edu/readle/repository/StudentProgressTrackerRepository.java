package com.edu.readle.repository;

import com.edu.readle.entity.StudentProgressTrackerEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProgressTrackerRepository extends JpaRepository<StudentProgressTrackerEntity, Long> {
    
    List<StudentProgressTrackerEntity> findByUser(UserEntity user);
    
    List<StudentProgressTrackerEntity> findByUserAndIsCompleted(UserEntity user, boolean isCompleted);
    
    Optional<StudentProgressTrackerEntity> findByUserAndBook(UserEntity user, BookEntity book);
    
    @Query("SELECT spt FROM StudentProgressTrackerEntity spt WHERE spt.user = :user AND spt.isCompleted = true ORDER BY spt.endTime DESC")
    List<StudentProgressTrackerEntity> findCompletedBooksByUser(@Param("user") UserEntity user);
    
    @Query("SELECT spt FROM StudentProgressTrackerEntity spt WHERE spt.user = :user AND spt.isCompleted = false ORDER BY spt.lastReadAt DESC")
    List<StudentProgressTrackerEntity> findInProgressBooksByUser(@Param("user") UserEntity user);
    
    @Query("SELECT COUNT(spt) FROM StudentProgressTrackerEntity spt WHERE spt.user = :user AND spt.isCompleted = true")
    Long countCompletedBooksByUser(@Param("user") UserEntity user);
    
    @Query("SELECT COUNT(spt) FROM StudentProgressTrackerEntity spt WHERE spt.user = :user AND spt.isCompleted = false")
    Long countInProgressBooksByUser(@Param("user") UserEntity user);
    
    @Query("SELECT AVG(spt.comprehensionScore) FROM StudentProgressTrackerEntity spt WHERE spt.user = :user AND spt.comprehensionScore > 0")
    Double getAverageComprehensionScore(@Param("user") UserEntity user);
    
    @Query("SELECT AVG(spt.vocabularyScore) FROM StudentProgressTrackerEntity spt WHERE spt.user = :user AND spt.vocabularyScore > 0")
    Double getAverageVocabularyScore(@Param("user") UserEntity user);
    
    @Query("SELECT AVG(spt.phonicsScore) FROM StudentProgressTrackerEntity spt WHERE spt.user = :user AND spt.phonicsScore > 0")
    Double getAveragePhonicsScore(@Param("user") UserEntity user);
    
    @Query("SELECT SUM(spt.wordsLearned) FROM SStudentProgressTrackerEntity spt WHERE spt.user = :user")
    Integer getTotalWordsLearned(@Param("user") UserEntity user);
}