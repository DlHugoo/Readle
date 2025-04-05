package com.edu.readle.repository;

import com.edu.readle.entity.Classroom;
import com.edu.readle.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByTeacher(UserEntity teacher);

    @Query("SELECT c FROM Classroom c JOIN c.students s WHERE s.userId = :studentId")
    List<Classroom> findByStudentId(Long studentId);

    List<Classroom> findByTeacherUserId(Long teacherId);
}