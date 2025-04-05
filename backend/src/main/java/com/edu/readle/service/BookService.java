package com.edu.readle.service;

import com.edu.readle.entity.BookEntity;
import com.edu.readle.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BookService {

    private final BookRepository bookRepository;

    @Autowired
    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public BookEntity addBook(BookEntity book) {
        return bookRepository.save(book);
    }

    public List<BookEntity> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<BookEntity> getBookById(String bookID) {
        return bookRepository.findById(bookID);
    }

    public void deleteBook(String bookID) {
        bookRepository.deleteById(bookID);
    }
}
