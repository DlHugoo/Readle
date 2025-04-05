package com.edu.readle.controller;

import com.edu.readle.entity.PageEntity;
import com.edu.readle.service.PageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pages")
public class PageController {

    private final PageService pageService;

    @Autowired
    public PageController(PageService pageService) {
        this.pageService = pageService;
    }

    // Add a page to a specific book
    @PostMapping("/{bookId}")
    public PageEntity addPageToBook(@PathVariable String bookId, @RequestBody PageEntity page) {
        return pageService.addPageToBook(bookId, page);
    }

    // Get all pages for a book
    @GetMapping("/{bookId}")
    public List<PageEntity> getPagesByBookId(@PathVariable String bookId) {
        return pageService.getPagesByBookId(bookId);
    }

    // Get a specific page in a book
    @GetMapping("/{bookId}/page/{pageNumber}")
    public Optional<PageEntity> getPageByBookAndNumber(
            @PathVariable String bookId,
            @PathVariable int pageNumber
    ) {
        return pageService.getPageByBookAndNumber(bookId, pageNumber);
    }
}
