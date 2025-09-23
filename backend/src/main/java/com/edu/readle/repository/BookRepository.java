package com.edu.readle.repository;

import com.edu.readle.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<BookEntity, Long> {
    // Optional: add custom queries here if needed
    List<BookEntity> findByClassroomIsNull();
    List<BookEntity> findByVisibleToAllTrue();
    List<BookEntity> findByClassroomIdAndArchivedFalse(Long classroomId);
    List<BookEntity> findByClassroomIdAndArchivedTrue(Long classroomId);
}
