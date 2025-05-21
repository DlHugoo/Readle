package com.edu.readle.repository;

import com.edu.readle.entity.PredictionImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PredictionImageRepository extends JpaRepository<PredictionImageEntity, Long> {
    // Basic CRUD operations are provided by JpaRepository
    // Add custom query methods here if needed
}