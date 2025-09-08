package com.edu.readle.repository;

import com.edu.readle.entity.BadgeEntity;
import com.edu.readle.entity.UserBadgeEntity;
import com.edu.readle.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadgeEntity, Long> {
    
    List<UserBadgeEntity> findByUser(UserEntity user);
    
    Optional<UserBadgeEntity> findByUserAndBadge(UserEntity user, BadgeEntity badge);
    
    @Query("SELECT ub FROM UserBadgeEntity ub WHERE ub.user = :user AND ub.currentProgress >= ub.badge.thresholdValue")
    List<UserBadgeEntity> findEarnedBadgesByUser(@Param("user") UserEntity user);
    
    @Query("SELECT ub FROM UserBadgeEntity ub WHERE ub.user = :user AND ub.currentProgress < ub.badge.thresholdValue")
    List<UserBadgeEntity> findInProgressBadgesByUser(@Param("user") UserEntity user);
    
    @Query("SELECT COUNT(ub) FROM UserBadgeEntity ub WHERE ub.user = :user AND ub.currentProgress >= ub.badge.thresholdValue")
    Long countEarnedBadgesByUser(@Param("user") UserEntity user);
    
    List<UserBadgeEntity> findByBadge(BadgeEntity badge);
}