package com.edu.readle.dto;

import java.util.List;

public class ClassroomDTO {
    private Long id;  // Added ID for the Classroom
    private String name;
    private String description;
    private String classroomCode;  // Added classroomCode for reference
    private String teacherId;
    private Integer maxStudents;
    private List<String> studentEmails;  // List of student emails instead of UserEntity
    private List<BookDTO> books;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getClassroomCode() {
        return classroomCode;
    }

    public void setClassroomCode(String classroomCode) {
        this.classroomCode = classroomCode;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public Integer getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(Integer maxStudents) {
        this.maxStudents = maxStudents;
    }

    public List<String> getStudentEmails() {
        return studentEmails;
    }

    public void setStudentEmails(List<String> studentEmails) {
        this.studentEmails = studentEmails;
    }

    public List<BookDTO> getBooks() {
        return books;
    }

    public void setBooks(List<BookDTO> books) {
        this.books = books;
    }
}
