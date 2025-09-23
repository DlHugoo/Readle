package com.edu.readle.service;

import com.edu.readle.dto.BookDTO;
import com.edu.readle.entity.BookEntity;
import com.edu.readle.entity.Classroom;
import com.edu.readle.repository.BookRepository;
import com.edu.readle.repository.ClassroomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.edu.readle.repository.StudentProgressTrackerRepository;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final ClassroomRepository classroomRepository;
    private final StudentProgressTrackerRepository progressRepository;

    public BookService(BookRepository bookRepository, ClassroomRepository classroomRepository, StudentProgressTrackerRepository progressRepository) {
        this.bookRepository = bookRepository;
        this.classroomRepository = classroomRepository;
        this.progressRepository = progressRepository;
    }

    // 🔹 For student "For You" section
    public List<BookEntity> getGlobalBooksForStudents() {
        return bookRepository.findByVisibleToAllTrue();
    }

    // 🔹 Admin creates global book
    @Transactional
    public BookEntity addBookAsAdmin(BookDTO bookDTO, Long adminId) {
        BookEntity book = new BookEntity();
        book.setTitle(bookDTO.getTitle());
        book.setAuthor(bookDTO.getAuthor());
        book.setGenre(bookDTO.getGenre());
        book.setDifficultyLevel(bookDTO.getDifficultyLevel());
        book.setImageURL(bookDTO.getImageURL());

        book.setVisibleToAll(true); // Global visibility
        book.setCreatedByAdminId(adminId); // Optional tracking

        return bookRepository.save(book);
    }

    // 🔹 Admin updates global book
    @Transactional
    public Optional<BookEntity> updateBookAsAdmin(Long bookID, BookDTO updatedBookDTO) {
        return bookRepository.findById(bookID).map(book -> {
            book.setTitle(updatedBookDTO.getTitle());
            book.setAuthor(updatedBookDTO.getAuthor());
            book.setGenre(updatedBookDTO.getGenre());
            book.setDifficultyLevel(updatedBookDTO.getDifficultyLevel());
            book.setImageURL(updatedBookDTO.getImageURL());

            book.setVisibleToAll(true); // Always retain global visibility

            return bookRepository.save(book);
        });
    }

    // 🔹 Admin/Teacher shared
    public List<BookEntity> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<BookEntity> getBookById(Long bookID) {
        return bookRepository.findById(bookID);
    }

    @Transactional
    public BookEntity addBook(BookDTO bookDTO) {
        BookEntity book = new BookEntity();
        book.setTitle(bookDTO.getTitle());
        book.setAuthor(bookDTO.getAuthor());
        book.setGenre(bookDTO.getGenre());
        book.setDifficultyLevel(bookDTO.getDifficultyLevel());
        book.setImageURL(bookDTO.getImageURL());
        book.setArchived(false);

        if (bookDTO.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(bookDTO.getClassroomId())
                    .orElseThrow(() -> new RuntimeException("Classroom not found"));
            book.setClassroom(classroom);
        }

        return bookRepository.save(book);
    }

    @Transactional
    public Optional<BookEntity> updateBook(Long bookID, BookDTO updatedBookDTO) {
        return bookRepository.findById(bookID).map(book -> {
            book.setTitle(updatedBookDTO.getTitle());
            book.setAuthor(updatedBookDTO.getAuthor());
            book.setGenre(updatedBookDTO.getGenre());
            book.setDifficultyLevel(updatedBookDTO.getDifficultyLevel());
            book.setImageURL(updatedBookDTO.getImageURL());

            if (updatedBookDTO.getClassroomId() != null) {
                Classroom classroom = classroomRepository.findById(updatedBookDTO.getClassroomId())
                        .orElseThrow(() -> new RuntimeException("Classroom not found"));
                book.setClassroom(classroom);
            } else {
                book.setClassroom(null);
            }

            return bookRepository.save(book);
        });
    }

    @Transactional
    public void archiveBook(Long bookId) {
        bookRepository.findById(bookId).ifPresent(book -> {
            book.setArchived(true);
            bookRepository.save(book);
        });
    }

    @Transactional
    public void unarchiveBook(Long bookId) {
        bookRepository.findById(bookId).ifPresent(book -> {
            book.setArchived(false);
            bookRepository.save(book);
        });
    }

    @Transactional
    public void deleteBook(Long bookID) {
        Optional<BookEntity> bookOptional = bookRepository.findById(bookID);
        if (bookOptional.isPresent()) {
            BookEntity book = bookOptional.get();
            
            // Remove classroom association if exists
            if (book.getClassroom() != null) {
                book.setClassroom(null);
            }
            
            // Clear pages (should be handled by cascade, but ensuring it's clean)
            if (book.getPages() != null) {
                book.getPages().clear();
            }
            
            // Clear snake questions (should be handled by cascade, but ensuring it's clean)
            if (book.getSnakeQuestions() != null) {
                book.getSnakeQuestions().clear();
            }
            
            // Save the changes before deletion
            bookRepository.save(book);
            
            // Now delete the book
            bookRepository.deleteById(bookID);
        }
    }

    public List<BookEntity> getBooksByClassroomId(Long classroomId) {
        // Only return active (non-archived) books
        return bookRepository.findByClassroomIdAndArchivedFalse(classroomId);
    }

    public List<BookEntity> getBooksWithoutClassroom() {
        return bookRepository.findByClassroomIsNull();
    }

    public List<BookEntity> getArchivedBooksByClassroomId(Long classroomId) {
        return bookRepository.findByClassroomIdAndArchivedTrue(classroomId);
    }

    public boolean hasProgress(BookEntity book) {
        return progressRepository.countByBook(book) > 0;
    }
}
