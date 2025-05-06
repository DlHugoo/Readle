package com.edu.readle.repository;

import com.edu.readle.entity.Story;
import com.edu.readle.entity.StoryImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryImageRepository extends JpaRepository<StoryImage, Long> {
    List<StoryImage> findByStory(Story story);
    List<StoryImage> findByStoryOrderBySequence(Story story);
}
