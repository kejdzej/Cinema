-- Schema for cinema app
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  duration INT NOT NULL DEFAULT 120
);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  datetime DATETIME NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  seats VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demo data
INSERT INTO movies (title, description, duration) VALUES
('Интерстеллар', 'Космическая драма', 169),
('Матрица', 'Киберпанк боевик', 136),
('Гладиатор', 'Исторический эпос', 155);

INSERT INTO sessions (movie_id, datetime, price) VALUES
(1, DATE_ADD(NOW(), INTERVAL 1 DAY), 12.50),
(1, DATE_ADD(NOW(), INTERVAL 2 DAY), 12.50),
(2, DATE_ADD(NOW(), INTERVAL 1 DAY), 10.00),
(3, DATE_ADD(NOW(), INTERVAL 3 DAY), 11.00);
