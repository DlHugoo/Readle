package com.edu.readle.repository;


import com.edu.readle.entity.PageEntity;
import com.edu.readle.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PageRepository extends JpaRepository<PageEntity, Long> {
    List<PageEntity> findByBook(BookEntity book);
    PageEntity findByBookAndPageNumber(BookEntity book, int pageNumber);
}