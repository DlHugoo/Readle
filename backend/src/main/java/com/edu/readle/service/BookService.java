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

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final ClassroomRepository classroomRepository;

    public BookService(BookRepository bookRepository, ClassroomRepository classroomRepository) {
        this.bookRepository = bookRepository;
        this.classroomRepository = classroomRepository;
    }

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
    

    public void deleteBook(Long bookID) {
        bookRepository.deleteById(bookID);
    }

    public List<BookEntity> getBooksByClassroomId(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
        return classroom.getBooks();
    }
}
