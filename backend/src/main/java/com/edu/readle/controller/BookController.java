package com.edu.readle.controller;

import com.edu.readle.dto.BookDTO;
import com.edu.readle.entity.BookEntity;
import com.edu.readle.service.BookService;
import io.jsonwebtoken.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.Map;
import java.util.Base64;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "https://readle-pi.vercel.app"})
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size

    @Autowired
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // 🔹 STUDENT: Get globally visible books ("For You" section)
    @GetMapping("/for-you")
    public List<BookEntity> getBooksForYou() {
        return bookService.getGlobalBooksForStudents();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/admin/archived")
    public ResponseEntity<List<BookEntity>> getArchivedBooksForAdmin() {
        List<BookEntity> archivedBooks = bookService.getArchivedBooks();
        return ResponseEntity.ok(archivedBooks);
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

    // 🔹 ADMIN: Delete a global book
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/admin/{bookId}")
    public ResponseEntity<?> deleteBookAsAdmin(@PathVariable Long bookId) {
        try {
            bookService.deleteBookAsAdmin(bookId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage()); // return readable message
        }
    }

    // 🔹 Delete book
    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long bookId) {
        bookService.deleteBook(bookId);
        return ResponseEntity.ok().build();
    }

    // 🔹 Check if book can be deleted (no content or progress)
    @GetMapping("/{bookId}/can-delete")
    public ResponseEntity<Boolean> canDeleteBook(@PathVariable Long bookId) {
        // A book can be deleted if it has no pages/activities and no progress
        Optional<BookEntity> bookOpt = bookService.getBookById(bookId);
        if (bookOpt.isEmpty()) return ResponseEntity.notFound().build();
        BookEntity book = bookOpt.get();
        boolean hasPages = book.getPages() != null && !book.getPages().isEmpty();
        boolean hasSnake = book.getSnakeQuestions() != null && !book.getSnakeQuestions().isEmpty();
        boolean hasProgress = false;
        try {
            // Lazy check using repository method countByBook
            hasProgress = bookService.hasProgress(book);
        } catch (Exception ignored) {}
        boolean canDelete = !(hasPages || hasSnake || hasProgress);
        return ResponseEntity.ok(canDelete);
    }

    // 🔹 TEACHER: Update classroom-specific book
    @PutMapping("/{bookId}")
    public Optional<BookEntity> updateBook(@PathVariable Long bookId, @RequestBody BookDTO updatedBookDTO) {
        return bookService.updateBook(bookId, updatedBookDTO);
    }

    // 🔹 Archive a book (soft-hide from active views)
    @PutMapping("/{bookId}/archive")
    public ResponseEntity<Void> archiveBook(@PathVariable Long bookId) {
        bookService.archiveBook(bookId);
        return ResponseEntity.ok().build();
    }

    // 🔹 Unarchive a book
    @PutMapping("/{bookId}/unarchive")
    public ResponseEntity<Void> unarchiveBook(@PathVariable Long bookId) {
        bookService.unarchiveBook(bookId);
        return ResponseEntity.ok().build();
    }

    // 🔹 Upload book cover image (multipart)
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

    // 🔹 Upload book cover image (base64) - Store directly as base64 like your old app
    @PostMapping(value = "/upload-image", consumes = "application/json")
    public ResponseEntity<String> uploadImageBase64(@RequestBody Map<String, Object> request) {
        try {
            String base64Data = (String) request.get("file");
            String filename = (String) request.get("filename");
            String contentType = (String) request.get("contentType");
            String uploadType = (String) request.getOrDefault("uploadType", "bookcovers");

            if (base64Data == null || base64Data.isEmpty()) {
                return ResponseEntity.badRequest().body("Base64 data is empty");
            }

            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Only image files are allowed");
            }

            // Check base64 size (approximate)
            if (base64Data.length() > MAX_FILE_SIZE * 4 / 3) { // Base64 is ~33% larger than binary
                return ResponseEntity.badRequest().body("File size exceeds the limit of 5MB");
            }

            // Return the base64 data directly (like your old app)
            // The frontend will handle displaying it
            return ResponseEntity.ok(base64Data);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to upload image: " + e.getMessage());
        }
    }

    // 🔹 Get archived books for a classroom
    @GetMapping("/classroom/{classroomId}/archived")
    public ResponseEntity<List<BookEntity>> getArchivedBooks(@PathVariable Long classroomId) {
        List<BookEntity> archivedBooks = bookService.getArchivedBooksByClassroomId(classroomId);
        return ResponseEntity.ok(archivedBooks);
    }

    @GetMapping("/archived")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<BookEntity>> getArchivedBooks() {
        return ResponseEntity.ok(bookService.getArchivedBooks());
    }

}
