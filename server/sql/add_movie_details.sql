-- Migracja: Dodanie pól do filmów (trailer, gatunek, reżyser, obsada, IMDb)
-- Data: 2025-12-18

-- Dodaj nowe kolumny do tabeli movies
ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS trailer_url VARCHAR(255) AFTER poster,
  ADD COLUMN IF NOT EXISTS genre VARCHAR(100) AFTER trailer_url,
  ADD COLUMN IF NOT EXISTS director VARCHAR(200) AFTER genre,
  ADD COLUMN IF NOT EXISTS cast TEXT AFTER director,
  ADD COLUMN IF NOT EXISTS imdb_id VARCHAR(20) AFTER cast,
  ADD COLUMN IF NOT EXISTS release_year INT AFTER imdb_id;

-- Zaktualizuj istniejące filmy danymi
UPDATE movies SET
  imdb_id = 'tt0816692',
  release_year = 2014,
  trailer_url = 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
  genre = 'Sci-Fi, Drama',
  director = 'Christopher Nolan'
WHERE title = 'Interstellar';

UPDATE movies SET
  imdb_id = 'tt0133093',
  release_year = 1999,
  trailer_url = 'https://www.youtube.com/watch?v=vKQi3bBA1y8',
  genre = 'Sci-Fi, Action',
  director = 'Lana Wachowski, Lilly Wachowski'
WHERE title = 'The Matrix';

UPDATE movies SET
  imdb_id = 'tt0172495',
  release_year = 2000,
  trailer_url = 'https://www.youtube.com/watch?v=owK1qxDselE',
  genre = 'Action, Drama',
  director = 'Ridley Scott'
WHERE title = 'Gladiator';

UPDATE movies SET
  imdb_id = 'tt0275847',
  release_year = 2002,
  trailer_url = 'https://www.youtube.com/watch?v=VWqJifMMgZE',
  genre = 'Animation, Family',
  director = 'Dean DeBlois, Chris Sanders'
WHERE title = 'Lilo & Stitch';

UPDATE movies SET
  imdb_id = 'tt1517268',
  release_year = 2023,
  trailer_url = 'https://www.youtube.com/watch?v=pBk4NYhWNMM',
  genre = 'Comedy, Fantasy',
  director = 'Greta Gerwig'
WHERE title = 'Barbie';

UPDATE movies SET
  imdb_id = 'tt1270797',
  release_year = 2018,
  trailer_url = 'https://www.youtube.com/watch?v=u9Mv98Gr5pY',
  genre = 'Action, Sci-Fi',
  director = 'Ruben Fleischer'
WHERE title = 'Venom';

UPDATE movies SET
  imdb_id = 'tt0103639',
  release_year = 1992,
  trailer_url = 'https://www.youtube.com/watch?v=G7EZ8bCj7jA',
  genre = 'Animation, Family',
  director = 'Ron Clements, John Musker',
  title = 'Aladdin'
WHERE title = 'Aladin' OR title = 'Aladdin';
