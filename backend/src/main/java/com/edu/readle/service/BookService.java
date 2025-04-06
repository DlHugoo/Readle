package com.edu.readle.service;

import com.edu.readle.entity.BookEntity;
import com.edu.readle.repository.BookRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BookService {

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public BookEntity addBook(BookEntity book) {
        return bookRepository.save(book);
    }

    public List<BookEntity> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<BookEntity> getBookById(Long bookID) {
        return bookRepository.findById(bookID);
    }

    public void deleteBook(Long bookID) {
        bookRepository.deleteById(bookID);
    }

    public BookEntity updateBook(Long bookID, BookEntity updatedBook) {
        BookEntity existingBook = bookRepository.findById(bookID)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        existingBook.setTitle(updatedBook.getTitle());
        existingBook.setAuthor(updatedBook.getAuthor());
        existingBook.setGenre(updatedBook.getGenre());
        existingBook.setDifficultyLevel(updatedBook.getDifficultyLevel());
        existingBook.setImageURL(updatedBook.getImageURL());

        return bookRepository.save(existingBook);
    }
}
