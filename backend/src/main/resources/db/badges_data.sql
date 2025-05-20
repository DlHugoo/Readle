-- Badge data initialization
INSERT INTO badges (name, description, badge_type, image_url, achievement_criteria, threshold_value)
VALUES 
('Welcome Aboard', 'You''ve logged in for the first time—your reading journey begins now!', 'BRONZE', '/uploads/badge/medal.png', 'LOGIN_COUNT', 1),
('Bookworm', 'Congratulations on completing your first book!', 'SILVER', '/uploads/badge/trophy.png', 'BOOKS_COMPLETED', 1),
('Genre Explorer', 'Read books from 2 different genres.', 'SILVER', '/uploads/badge/medal.png', 'GENRES_READ', 2),
('Reading Marathoner', 'Spent over 10 hours reading in total!', 'GOLD', '/uploads/badge/trophy.png', 'READING_TIME', 600),
('Page Turner', 'You''ve read 50 pages—keep it going!', 'BRONZE', '/uploads/badge/medal.png', 'PAGES_READ', 50);