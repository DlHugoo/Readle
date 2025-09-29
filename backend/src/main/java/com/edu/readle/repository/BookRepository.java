package com.edu.readle.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.edu.readle.entity.BookEntity;

@Repository
public interface BookRepository extends JpaRepository<BookEntity, Long> {
    // Update query to include explicit ordering
    List<BookEntity> findByClassroomIdAndArchivedTrueOrderByTitleAsc(Long classroomId);
    // Optional: add custom queries here if needed
    List<BookEntity> findByClassroomIsNull();
    List<BookEntity> findByVisibleToAllTrue();
    List<BookEntity> findByClassroomIdAndArchivedFalse(Long classroomId);
    List<BookEntity> findByClassroomIdAndArchivedTrue(Long classroomId);
    List<BookEntity> findByArchivedFalse();
    List<BookEntity> findByArchivedTrue();
}
