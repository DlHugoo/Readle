package com.edu.readle.service;

import com.edu.readle.entity.BookEntity;
import com.edu.readle.entity.PageEntity;
import com.edu.readle.repository.BookRepository;
import com.edu.readle.repository.PageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PageService {

    private final PageRepository pageRepository;
    private final BookRepository bookRepository;

    @Autowired
    public PageService(PageRepository pageRepository, BookRepository bookRepository) {
        this.pageRepository = pageRepository;
        this.bookRepository = bookRepository;
    }

    public PageEntity addPageToBook(String bookID, PageEntity page) {
        Optional<BookEntity> optionalBook = bookRepository.findById(bookID);
        if (optionalBook.isPresent()) {
            BookEntity book = optionalBook.get();
            page.setBook(book);
            return pageRepository.save(page);
        } else {
            throw new RuntimeException("Book not found with ID: " + bookID);
        }
    }

    public List<PageEntity> getPagesByBookId(String bookID) {
        Optional<BookEntity> optionalBook = bookRepository.findById(bookID);
        return optionalBook.map(pageRepository::findByBook).orElseThrow(() ->
            new RuntimeException("Book not found with ID: " + bookID));
    }

    public Optional<PageEntity> getPageByBookAndNumber(String bookID, int pageNumber) {
        Optional<BookEntity> optionalBook = bookRepository.findById(bookID);
        return optionalBook.map(book -> Optional.ofNullable(pageRepository.findByBookAndPageNumber(book, pageNumber)))
                .orElse(Optional.empty());
    }
}
