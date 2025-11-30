-- Aktualizacja sal kinowych
-- Sala 1: 72 miejsca (bez zmian) - 9 rzędów po 8 miejsc
UPDATE cinema_halls SET capacity = 72, description = 'standard' WHERE id = 1 OR name LIKE '%Sala 1%' LIMIT 1;

-- Sala 2: 50 miejsc - same fotele pojedyncze (5 rzędów po 10)
UPDATE cinema_halls SET capacity = 50, description = 'standard' WHERE id = 2 OR name LIKE '%Sala 2%' LIMIT 1;

-- Sala 3: 96 miejsc fizycznych - 8 rzędów foteli (8 x 8 = 64) + 2 rzędy kanap (8 x 2 x 2 = 32)
-- W bazie: 8 rzędów x 8 + 2 rzędy x 8 = 64 + 16 = 80 miejsc (ale capacity = 96 bo kanapy liczą się x2)
UPDATE cinema_halls SET capacity = 96, description = 'mixed' WHERE id = 3 OR name LIKE '%Sala 3%' LIMIT 1;

-- Sala 4: 72 miejsca fizyczne VIP - 5 rzędów foteli VIP (8 x 5 = 40) + 2 rzędy kanap VIP (8 x 2 x 2 = 32)
-- W bazie: 5 rzędów x 8 + 2 rzędy x 8 = 40 + 16 = 56 miejsc (ale capacity = 72 bo kanapy liczą się x2)
UPDATE cinema_halls SET capacity = 72, description = 'vip' WHERE id = 4 OR name LIKE '%Sala 4%' LIMIT 1;

-- Jeśli sal nie ma, utwórz je
INSERT INTO cinema_halls (name, capacity, description) 
SELECT 'Sala 1', 72, 'standard' WHERE NOT EXISTS (SELECT 1 FROM cinema_halls WHERE name = 'Sala 1');
INSERT INTO cinema_halls (name, capacity, description) 
SELECT 'Sala 2', 50, 'standard' WHERE NOT EXISTS (SELECT 1 FROM cinema_halls WHERE name = 'Sala 2');
INSERT INTO cinema_halls (name, capacity, description) 
SELECT 'Sala 3', 96, 'mixed' WHERE NOT EXISTS (SELECT 1 FROM cinema_halls WHERE name = 'Sala 3');
INSERT INTO cinema_halls (name, capacity, description) 
SELECT 'Sala 4', 72, 'vip' WHERE NOT EXISTS (SELECT 1 FROM cinema_halls WHERE name = 'Sala 4');

