-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: cinema
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `movies`
--

DROP TABLE IF EXISTS `movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `duration` int NOT NULL DEFAULT '120',
  `poster` varchar(255) DEFAULT NULL,
  `trailer_url` varchar(255) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `director` varchar(200) DEFAULT NULL,
  `cast` text,
  `imdb_id` varchar(20) DEFAULT NULL,
  `release_year` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movies`
--

LOCK TABLES `movies` WRITE;
/*!40000 ALTER TABLE `movies` DISABLE KEYS */;
INSERT INTO `movies` VALUES
(1,'Interstellar','Epicka opowieść o ratowaniu ludzkości poprzez podróże kosmiczne',169,'/posters/interstellar.jpeg','https://www.youtube.com/watch?v=zSWdZVtXT7E','Sci-Fi, Drama','Christopher Nolan',NULL,'tt0816692',2014),
(2,'The Matrix','Rewolucyjny film science-fiction o rzeczywistości i symulacji',136,'/posters/matrix.jpg','https://www.youtube.com/watch?v=vKQi3bBA1y8','Sci-Fi, Action','Lana Wachowski, Lilly Wachowski',NULL,'tt0133093',1999),
(3,'Gladiator','Historyczna epopeja o upadłym rzymskim generale',155,'/posters/gladiator.jpg','https://www.youtube.com/watch?v=owK1qxDselE','Action, Drama','Ridley Scott',NULL,'tt0172495',2000),
(4,'Lilo & Stitch','Animowana opowieść o przyjaźni między małą dziewczynką a kosmicznym stworzeniem.',85,'/posters/lilo-stitch.jpg','https://www.youtube.com/watch?v=VWqJifMMgZE','Animation, Family','Dean DeBlois, Chris Sanders',NULL,'tt0275847',2002),
(6,'Barbie','Współczesna komedia przygodowa o Barbie odkrywającej swoje miejsce w świecie.',114,'/posters/barbie.jpg','https://www.youtube.com/watch?v=pBk4NYhWNMM','Comedy, Fantasy','Greta Gerwig',NULL,'tt1517268',2023),
(7,'Venom','Historia dziennikarza Eddiego Brocka, który staje się gospodarzem dla obcego symbionta.',112,'/posters/venom.jpg','https://www.youtube.com/watch?v=u9Mv98Gr5pY','Action, Sci-Fi','Ruben Fleischer',NULL,'tt1270797',2018),
(8,'Aladdin','Klasyczna bajka Disneya o magicznej lampie i zaczarowanym świecie.',90,'/posters/aladdin.jpg','https://www.youtube.com/watch?v=G7EZ8bCj7jA','Animation, Family','Ron Clements, John Musker',NULL,'tt0103639',1992);
/*!40000 ALTER TABLE `movies` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-29 16:19:38
