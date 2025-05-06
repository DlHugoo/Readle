package com.edu.readle.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edu.readle.dto.BookDTO;
import com.edu.readle.dto.ClassroomDTO;
import com.edu.readle.entity.BookEntity;
import com.edu.readle.entity.Classroom;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.BookRepository;
import com.edu.readle.repository.ClassroomRepository;
import com.edu.readle.repository.UserRepository;

@Service
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public ClassroomService(ClassroomRepository classroomRepository, UserRepository userRepository, BookRepository bookRepository) {
        this.classroomRepository = classroomRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    // Fetch all classrooms
    public List<Classroom> getAllClassrooms() {
        return classroomRepository.findAll();
    }

    // Fetch classroom by ID
    public Optional<Classroom> getClassroomById(Long id) {
        return classroomRepository.findById(id);
    }

    // Create a new classroom
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

    // Generate a unique classroom code
    private String generateUniqueClassroomCode() {
        String code;
        do {
            code = "CLS" + (int)(Math.random() * 9000 + 1000);
        } while (classroomRepository.existsByClassroomCode(code));
        return code;
    }

    // Update classroom details
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

    // Map classroom entity to DTO
    public ClassroomDTO mapToDTO(Classroom classroom) {
        ClassroomDTO dto = new ClassroomDTO();
        dto.setName(classroom.getName());
        dto.setDescription(classroom.getDescription());
        dto.setTeacherId(classroom.getTeacher() != null ? classroom.getTeacher().getEmail() : null);
        dto.setMaxStudents(classroom.getMaxStudents());
        dto.setClassroomCode(classroom.getClassroomCode());

        // Adding student emails to the DTO
        List<String> studentEmails = classroom.getStudents().stream()
                .map(UserEntity::getEmail)
                .collect(Collectors.toList());
        dto.setStudentEmails(studentEmails);

        // Mapping books to the DTO
        List<BookDTO> books = classroom.getBooks().stream()
                .map(book -> new BookDTO(book.getBookID(), book.getTitle(), book.getAuthor(), book.getGenre(),
                        book.getDifficultyLevel(), book.getImageURL(), classroom.getId(), null))
                .collect(Collectors.toList());
        dto.setBooks(books);
        
        return dto;
    }

    // Delete classroom
    public void deleteClassroom(Long id) {
        classroomRepository.deleteById(id);
    }

    // Add student to classroom
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

    // Remove student from classroom
    @Transactional
    public void removeStudentFromClassroom(Long classroomId, Long studentId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        classroom.removeStudent(student);
        classroomRepository.save(classroom);
    }

    // Get classrooms by teacher's email
    public List<Classroom> getClassroomsByTeacher(String email) {
        UserEntity teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Teacher not found with email: " + email));
        return classroomRepository.findByTeacher(teacher);
    }

    // Get classrooms by student's ID
    public List<Classroom> getClassroomsByStudent(Long studentId) {
        return classroomRepository.findByStudentId(studentId);
    }

    // 📘 BOOK RELATIONSHIP METHODS

    // Add book to classroom
    @Transactional
    public void addBookToClassroom(Long classroomId, Long bookId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        book.setClassroom(classroom);
        bookRepository.save(book);
    }

    // Remove book from classroom
    @Transactional
    public void removeBookFromClassroom(Long classroomId, Long bookId) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (book.getClassroom() == null || !book.getClassroom().getId().equals(classroomId)) {
            throw new RuntimeException("Book does not belong to the given classroom");
        }

        book.setClassroom(null);
        bookRepository.save(book);
    }

    // Get books by classroom
    public List<BookEntity> getBooksByClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        return classroom.getBooks() != null ? classroom.getBooks() : new ArrayList<>();
    }

    // Join classroom - prevent multiple joins for same student
    @Transactional
    public void joinClassroom(Long studentId, String classroomCode) {
        // Fetch classroom by its code
        Classroom classroom = classroomRepository.findByClassroomCode(classroomCode);
        if (classroom == null) {
            throw new RuntimeException("Classroom not found.");
        }

        // Check if the classroom is full
        if (classroom.getStudentCount() >= classroom.getMaxStudents()) {
            throw new RuntimeException("Classroom is full.");
        }

        // Fetch the student by ID
        UserEntity student = userRepository.findById(studentId).orElse(null);
        if (student == null) {
            throw new RuntimeException("Student not found.");
        }

        // Check if the student is already enrolled in the classroom
        if (classroom.getStudents().contains(student)) {
            throw new RuntimeException("Student is already in the classroom.");
        }

        // Add the student to the classroom
        classroom.addStudent(student);
        classroomRepository.save(classroom);
    }
}
