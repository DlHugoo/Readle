package com.edu.readle.repository;

import com.edu.readle.entity.BadgeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<BadgeEntity, Long> {
    
    Optional<BadgeEntity> findByName(String name);
    
    List<BadgeEntity> findByAchievementCriteria(String achievementCriteria);
    
    List<BadgeEntity> findByBadgeType(String badgeType);
}