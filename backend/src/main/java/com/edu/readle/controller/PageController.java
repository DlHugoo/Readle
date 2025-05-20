package com.edu.readle.controller;

import com.edu.readle.entity.PageEntity;
import com.edu.readle.service.PageService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pages")
public class PageController {

    private final PageService pageService;

    public PageController(PageService pageService) {
        this.pageService = pageService;
    }

    // 🔐 Add a page to a specific book
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PostMapping("/{bookId}")
    public PageEntity addPageToBook(@PathVariable Long bookId, @RequestBody PageEntity page) {
        return pageService.addPageToBook(bookId, page);
    }

    // 🔐 Get all pages for a specific book
    @GetMapping("/{bookId}")
    public List<PageEntity> getPagesByBookId(@PathVariable Long bookId) {
        return pageService.getPagesByBookId(bookId);
    }

    // 🔐 Get a specific page by page number for a book
    @GetMapping("/{bookId}/page/{pageNumber}")
    public Optional<PageEntity> getPageByBookAndNumber(
            @PathVariable Long bookId,
            @PathVariable int pageNumber
    ) {
        return pageService.getPageByBookAndNumber(bookId, pageNumber);
    }

    // 🔐 Update a page
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PutMapping("/{bookId}/page/{pageId}")
    public PageEntity updatePage(
            @PathVariable Long bookId,
            @PathVariable Long pageId,
            @RequestBody PageEntity updatedPage
    ) {
        return pageService.updatePage(bookId, pageId, updatedPage);
    }

    // 🔐 Delete a page
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @DeleteMapping("/{bookId}/page/{pageId}")
    public void deletePage(@PathVariable Long bookId, @PathVariable Long pageId) {
        pageService.deletePage(bookId, pageId);
    }
}
