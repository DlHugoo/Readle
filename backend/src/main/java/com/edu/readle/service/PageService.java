package com.edu.readle.service;

import com.edu.readle.entity.BookEntity;
import com.edu.readle.entity.PageEntity;
import com.edu.readle.repository.BookRepository;
import com.edu.readle.repository.PageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PageService {

    private final PageRepository pageRepository;
    private final BookRepository bookRepository;

    public PageService(PageRepository pageRepository, BookRepository bookRepository) {
        this.pageRepository = pageRepository;
        this.bookRepository = bookRepository;
    }

    public PageEntity addPageToBook(Long bookID, PageEntity page) {
        Optional<BookEntity> optionalBook = bookRepository.findById(bookID);
        if (optionalBook.isPresent()) {
            BookEntity book = optionalBook.get();
            page.setBook(book);
            return pageRepository.save(page);
        } else {
            throw new RuntimeException("Book not found with ID: " + bookID);
        }
    }

    public List<PageEntity> getPagesByBookId(Long bookID) {
        Optional<BookEntity> optionalBook = bookRepository.findById(bookID);
        return optionalBook.map(pageRepository::findByBook)
                .orElseThrow(() -> new RuntimeException("Book not found with ID: " + bookID));
    }

    public Optional<PageEntity> getPageByBookAndNumber(Long bookID, int pageNumber) {
        Optional<BookEntity> optionalBook = bookRepository.findById(bookID);
        return optionalBook.map(book -> Optional.ofNullable(pageRepository.findByBookAndPageNumber(book, pageNumber)))
                .orElse(Optional.empty());
    }

    public PageEntity updatePage(Long bookId, Long pageId, PageEntity updatedPage) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        PageEntity existingPage = pageRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found"));

        if (!existingPage.getBook().getBookID().equals(book.getBookID())) {
            throw new RuntimeException("Page does not belong to the specified book");
        }

        existingPage.setPageNumber(updatedPage.getPageNumber());
        existingPage.setContent(updatedPage.getContent());
        existingPage.setImageURL(updatedPage.getImageURL());

        return pageRepository.save(existingPage);
    }

    public void deletePage(Long bookId, Long pageId) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        PageEntity page = pageRepository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Page not found"));

        if (!page.getBook().getBookID().equals(book.getBookID())) {
            throw new RuntimeException("Page does not belong to the specified book");
        }

        pageRepository.delete(page);
    }
}
