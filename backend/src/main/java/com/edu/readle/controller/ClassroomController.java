package com.edu.readle.controller;

import com.edu.readle.dto.ClassroomDTO;
import com.edu.readle.entity.Classroom;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.ClassroomRepository;
import com.edu.readle.repository.UserRepository;
import com.edu.readle.service.ClassroomService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classrooms")
public class ClassroomController {

    private final ClassroomService classroomService;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    // Constructor injection
    public ClassroomController(ClassroomService classroomService, ClassroomRepository classroomRepository) {
        this.classroomService = classroomService;
        this.classroomRepository = classroomRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<List<Classroom>> getAllClassrooms() {
        return ResponseEntity.ok(classroomService.getAllClassrooms());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN') or hasAuthority('STUDENT')")
    public ResponseEntity<ClassroomDTO> getClassroomById(@PathVariable Long id) {
        return classroomService.getClassroomById(id)
                .map(classroom -> ResponseEntity.ok(classroomService.mapToDTO(classroom)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<Classroom> createClassroom(@RequestBody ClassroomDTO classroomDTO) {
        return ResponseEntity.ok(classroomService.createClassroom(classroomDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<ClassroomDTO> updateClassroom(@PathVariable Long id, @RequestBody ClassroomDTO classroomDTO) {
        return classroomService.updateClassroom(id, classroomDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteClassroom(@PathVariable Long id) {
        classroomService.deleteClassroom(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{classroomId}/students/{studentId}")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<Void> addStudentToClassroom(@PathVariable Long classroomId, @PathVariable Long studentId) {
        classroomService.addStudentToClassroom(classroomId, studentId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{classroomId}/students/{studentId}")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<Void> removeStudentFromClassroom(@PathVariable Long classroomId,
                                                           @PathVariable Long studentId) {
        classroomService.removeStudentFromClassroom(classroomId, studentId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/teacher/{email}")
    @PreAuthorize("hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<List<Classroom>> getClassroomsByTeacher(@PathVariable String email) {
        return ResponseEntity.ok(classroomService.getClassroomsByTeacher(email));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('STUDENT') or hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<List<Classroom>> getClassroomsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(classroomService.getClassroomsByStudent(studentId));
    }

    @PostMapping("/join")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<String> joinClassroom(@RequestParam Long studentId, @RequestParam String classroomCode) {
        // Fetch classroom by classroomCode
        Classroom classroom = classroomRepository.findByClassroomCode(classroomCode);
        if (classroom == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Classroom not found.");
        }

        // Check if the classroom is full
        if (classroom.getStudentCount() >= classroom.getMaxStudents()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Classroom is full.");
        }

        // Fetch the student by studentId
        UserEntity student = userRepository.findById(studentId).orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Student not found.");
        }

        // Log the current list of students in the classroom and the student trying to join
        System.out.println("Classroom students: " + classroom.getStudents());
        System.out.println("Checking if student " + student.getEmail() + " is already in the classroom.");

        // Check if the student is already enrolled in the classroom
        if (classroom.getStudents().contains(student)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Student is already in the classroom.");
        }

        // Add the student to the classroom
        classroom.addStudent(student);
        classroomRepository.save(classroom);  // Save the updated classroom

        return ResponseEntity.ok("Successfully joined the classroom.");
    }
}
