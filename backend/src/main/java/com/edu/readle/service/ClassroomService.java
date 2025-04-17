package com.edu.readle.service;

import com.edu.readle.dto.ClassroomDTO;
import com.edu.readle.entity.Classroom;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.ClassroomRepository;
import com.edu.readle.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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
        UserEntity teacher = userRepository.findByEmail(classroomDTO.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Classroom classroom = new Classroom();
        classroom.setName(classroomDTO.getName());
        classroom.setDescription(classroomDTO.getDescription());
        classroom.setTeacher(teacher);
        classroom.setMaxStudents(classroomDTO.getMaxStudents());
        String code = generateUniqueClassroomCode();
        classroom.setClassroomCode(code);

        return classroomRepository.save(classroom);
    }

    private String generateUniqueClassroomCode() {
        String code;
        do {
            code = "CLS" + (int)(Math.random() * 9000 + 1000);
        } while (classroomRepository.existsByClassroomCode(code));
        return code;
    }


    @Transactional
    public Optional<ClassroomDTO> updateClassroom(Long id, ClassroomDTO classroomDTO) {
        return classroomRepository.findById(id).map(classroom -> {
            classroom.setName(classroomDTO.getName());
            classroom.setDescription(classroomDTO.getDescription());

            if (classroomDTO.getTeacherId() != null) {
                UserEntity teacher = userRepository.findByEmail(classroomDTO.getTeacherId())
                        .orElseThrow(() -> new RuntimeException("Teacher not found"));
                classroom.setTeacher(teacher);
            }

            classroom.setMaxStudents(classroomDTO.getMaxStudents());
            Classroom updatedClassroom = classroomRepository.save(classroom);

            // Map the updated entity to a DTO
            return mapToDTO(updatedClassroom);
        });
    }

    public ClassroomDTO mapToDTO(Classroom classroom) {
        ClassroomDTO dto = new ClassroomDTO();
        dto.setName(classroom.getName());
        dto.setDescription(classroom.getDescription());
        dto.setTeacherId(classroom.getTeacher() != null ? classroom.getTeacher().getEmail() : null);
        dto.setMaxStudents(classroom.getMaxStudents());
        return dto;
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

    public List<Classroom> getClassroomsByTeacher(String email) {
        UserEntity teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Teacher not found with email: " + email));
        return classroomRepository.findByTeacher(teacher);
    }

    public List<Classroom> getClassroomsByStudent(Long studentId) {
        return classroomRepository.findByStudentId(studentId);
    }

}