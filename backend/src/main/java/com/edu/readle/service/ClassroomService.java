package com.edu.readle.service;

import com.edu.readle.dto.ClassroomDTO;
import com.edu.readle.entity.Classroom;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.ClassroomRepository;
import com.edu.readle.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    public ClassroomService(ClassroomRepository classroomRepository, UserRepository userRepository) {
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
    }

    public List<Classroom> getAllClassrooms() {
        return classroomRepository.findAll();
    }

    public Optional<Classroom> getClassroomById(Long id) {
        return classroomRepository.findById(id);
    }

    @Transactional
    public Classroom createClassroom(ClassroomDTO classroomDTO) {
        UserEntity teacher = userRepository.findById(classroomDTO.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Classroom classroom = new Classroom();
        classroom.setName(classroomDTO.getName());
        classroom.setDescription(classroomDTO.getDescription());
        classroom.setTeacher(teacher);
        classroom.setMaxStudents(classroomDTO.getMaxStudents());

        return classroomRepository.save(classroom);
    }

    @Transactional
    public Optional<Classroom> updateClassroom(Long id, ClassroomDTO classroomDTO) {
        return classroomRepository.findById(id).map(classroom -> {
            classroom.setName(classroomDTO.getName());
            classroom.setDescription(classroomDTO.getDescription());

            if (classroomDTO.getTeacherId() != null) {
                UserEntity teacher = userRepository.findById(classroomDTO.getTeacherId())
                        .orElseThrow(() -> new RuntimeException("Teacher not found"));
                classroom.setTeacher(teacher);
            }

            classroom.setMaxStudents(classroomDTO.getMaxStudents());

            return classroomRepository.save(classroom);
        });
    }

    public void deleteClassroom(Long id) {
        classroomRepository.deleteById(id);
    }

    @Transactional
    public void addStudentToClassroom(Long classroomId, Long studentId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (classroom.getMaxStudents() != null && classroom.getStudentCount() >= classroom.getMaxStudents()) {
            throw new RuntimeException("Classroom is full");
        }

        classroom.addStudent(student);
        classroomRepository.save(classroom);
    }

    @Transactional
    public void removeStudentFromClassroom(Long classroomId, Long studentId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        classroom.removeStudent(student);
        classroomRepository.save(classroom);
    }

    public List<Classroom> getClassroomsByTeacher(Long teacherId) {
        return classroomRepository.findByTeacherUserId(teacherId);
    }

    public List<Classroom> getClassroomsByStudent(Long studentId) {
        return classroomRepository.findByStudentId(studentId);
    }
}