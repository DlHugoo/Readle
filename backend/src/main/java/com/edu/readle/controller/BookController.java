package com.edu.readle.controller;

import com.edu.readle.entity.BookEntity;
import com.edu.readle.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    @Autowired
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @PostMapping
    public BookEntity addBook(@RequestBody BookEntity book) {
        return bookService.addBook(book);
    }

    @GetMapping
    public List<BookEntity> getAllBooks() {
        return bookService.getAllBooks();
    }

    @GetMapping("/{bookId}")
    public Optional<BookEntity> getBookById(@PathVariable String bookId) {
        return bookService.getBookById(bookId);
    }

    @DeleteMapping("/{bookId}")
    public void deleteBook(@PathVariable String bookId) {
        bookService.deleteBook(bookId);
    }
}
