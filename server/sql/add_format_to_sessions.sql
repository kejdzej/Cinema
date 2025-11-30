-- Dodaj kolumnę format do tabeli sessions dla obsługi seansów 3D
ALTER TABLE sessions ADD COLUMN format ENUM('2D', '3D') DEFAULT '2D' AFTER price;

