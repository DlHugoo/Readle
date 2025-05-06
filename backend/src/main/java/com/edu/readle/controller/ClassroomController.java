package com.edu.readle.controller;

import com.edu.readle.dto.ClassroomDTO;
import com.edu.readle.entity.BookEntity;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classrooms")
public class ClassroomController {

    private final ClassroomService classroomService;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

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
    public ResponseEntity<List<ClassroomDTO>> getClassroomsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(classroomService.getClassroomsByStudent(studentId));
    }

    @PostMapping("/join")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<Map<String, String>> joinClassroom(@RequestParam Long studentId, @RequestParam String classroomCode) {
        Map<String, String> response = new HashMap<>();

        Classroom classroom = classroomRepository.findByClassroomCode(classroomCode);
        if (classroom == null) {
            response.put("error", "Classroom not found.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (classroom.getStudentCount() >= classroom.getMaxStudents()) {
            response.put("error", "Classroom is full.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        UserEntity student = userRepository.findById(studentId).orElse(null);
        if (student == null) {
            response.put("error", "Student not found.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        System.out.println("Classroom students: " + classroom.getStudents());
        System.out.println("Checking if student " + student.getEmail() + " is already in the classroom.");

        if (classroom.getStudents().contains(student)) {
            response.put("error", "Student is already in the classroom.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        classroom.addStudent(student);
        classroomRepository.save(classroom);

        response.put("message", "Successfully joined the classroom.");
        return ResponseEntity.ok(response);
    }

    // ✅ NEW ENDPOINT: GET /api/classrooms/{id}/books
    @GetMapping("/{id}/books")
    @PreAuthorize("hasAuthority('STUDENT') or hasAuthority('TEACHER') or hasAuthority('ADMIN')")
    public ResponseEntity<?> getBooksByClassroom(@PathVariable Long id) {
        try {
            List<BookEntity> books = classroomService.getBooksByClassroomId(id);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching books.");
        }
    }
}
