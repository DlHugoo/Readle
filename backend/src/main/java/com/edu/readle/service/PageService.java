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
    private final BadgeService badgeService;

    public PageService(PageRepository pageRepository, BookRepository bookRepository, BadgeService badgeService) {
        this.pageRepository = pageRepository;
        this.bookRepository = bookRepository;
        this.badgeService = badgeService;
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

    /**
     * Track that a user has read a specific page
     * @param userId The ID of the user who read the page
     * @param bookId The ID of the book containing the page
     * @param pageNumber The page number that was read
     */
    public void trackPageRead(Long userId, Long bookId, int pageNumber) {
        // Verify the page exists
        Optional<BookEntity> optionalBook = bookRepository.findById(bookId);
        if (optionalBook.isPresent()) {
            BookEntity book = optionalBook.get();
            PageEntity page = pageRepository.findByBookAndPageNumber(book, pageNumber);
            
            if (page != null) {
                // Track this page read for badge progress
                badgeService.trackPagesRead(userId, 1);
            }
        }
    }
}
