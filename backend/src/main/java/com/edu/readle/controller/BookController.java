package com.edu.readle.controller;

import com.edu.readle.dto.BookDTO;
import com.edu.readle.entity.BookEntity;
import com.edu.readle.service.BookService;
import io.jsonwebtoken.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // 🔹 STUDENT: Get globally visible books ("For You" section)
    @GetMapping("/for-you")
    public List<BookEntity> getBooksForYou() {
        return bookService.getGlobalBooksForStudents();
    }

    // 🔹 ADMIN: Create a global book
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping("/admin")
    public BookEntity addBookAsAdmin(@RequestBody BookDTO book, @RequestParam Long adminId) {
        return bookService.addBookAsAdmin(book, adminId);
    }

    // 🔹 ADMIN: Update a global book
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/admin/{bookId}")
    public Optional<BookEntity> updateBookAsAdmin(@PathVariable Long bookId, @RequestBody BookDTO bookDTO) {
        return bookService.updateBookAsAdmin(bookId, bookDTO);
    }

    // 🔹 TEACHER/ADMIN: Create classroom-specific book
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PostMapping
    public BookEntity addBook(@RequestBody BookDTO book) {
        return bookService.addBook(book);
    }

    // 🔹 Get all books
    @GetMapping
    public List<BookEntity> getAllBooks() {
        return bookService.getAllBooks();
    }

    // 🔹 Get all books without classroom (legacy)
    @GetMapping("/public")
    public List<BookEntity> getBooksWithoutClassroom() {
        return bookService.getBooksWithoutClassroom();
    }

    // 🔹 Get book by ID
    @GetMapping("/{bookId}")
    public Optional<BookEntity> getBookById(@PathVariable Long bookId) {
        return bookService.getBookById(bookId);
    }

    // 🔹 Delete book
    @DeleteMapping("/{bookId}")
    public void deleteBook(@PathVariable Long bookId) {
        bookService.deleteBook(bookId);
    }

    // 🔹 TEACHER: Update classroom-specific book
    @PutMapping("/{bookId}")
    public Optional<BookEntity> updateBook(@PathVariable Long bookId, @RequestBody BookDTO updatedBookDTO) {
        return bookService.updateBook(bookId, updatedBookDTO);
    }

    // 🔹 Upload book cover image
    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file,
            @RequestParam(value = "uploadType", defaultValue = "bookcovers") String uploadType)
            throws java.io.IOException {

        String uploadDir = "uploads/" + uploadType + "/";

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body("File size exceeds the limit of 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Only image files are allowed");
        }

        try {
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.write(filePath, file.getBytes());

            String fileUrl = "/uploads/" + uploadType + "/" + fileName;
            return ResponseEntity.ok(fileUrl);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to upload image: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("An unexpected error occurred: " + e.getMessage());
        }
    }
}
