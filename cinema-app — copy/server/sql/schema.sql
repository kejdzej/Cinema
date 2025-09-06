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
  price DECIMAL(10,2) NOT NULL,  -- ✅ DODANO KOLUMNĘ PRICE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  stripe_payment_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Dane demonstracyjne
INSERT INTO movies (title, description, duration) VALUES
('Interstellar', 'Epicka opowieść o ratowaniu ludzkości poprzez podróże kosmiczne', 169),
('The Matrix', 'Rewolucyjny film science-fiction o rzeczywistości i symulacji', 136),
('Gladiator', 'Historyczna epopeja o upadłym rzymskim generale', 155);

INSERT INTO sessions (movie_id, datetime, price) VALUES
(1, DATE_ADD(NOW(), INTERVAL 1 DAY), 25.00),
(1, DATE_ADD(NOW(), INTERVAL 2 DAY), 25.00),
(2, DATE_ADD(NOW(), INTERVAL 1 DAY), 20.00),
(3, DATE_ADD(NOW(), INTERVAL 3 DAY), 22.00);
