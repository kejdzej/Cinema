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
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `items` json NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (6,1,'[{\"id\": 1, \"img\": \"/posters/popcorn.jpg\", \"qty\": 1, \"name\": \"Popcorn klasyczny\", \"price\": 12}]',12.00,'paid','2025-10-22 16:51:51',0.00),(7,1,'[{\"id\": 2, \"img\": \"/posters/nachos.jpg\", \"qty\": 1, \"name\": \"Nachosy z sosem\", \"price\": 15}]',15.00,'paid','2025-10-22 16:56:16',0.00),(8,1,'[{\"id\": 1, \"img\": \"/posters/popcorn.jpg\", \"qty\": 1, \"name\": \"Popcorn klasyczny\", \"price\": 12}, {\"id\": 3, \"img\": \"/posters/cola.png\", \"qty\": 1, \"name\": \"Cola 0.5l\", \"price\": 8}]',20.00,'paid','2025-10-22 16:57:54',0.00),(9,1,'[{\"id\": 3, \"img\": \"/posters/cola.png\", \"qty\": 1, \"name\": \"Cola 0.5l\", \"price\": 8}]',8.00,'paid','2025-10-22 17:00:03',0.00),(10,1,'[{\"id\": 1, \"img\": \"/posters/popcorn.jpg\", \"qty\": 1, \"name\": \"Popcorn klasyczny\", \"price\": 12}]',12.00,'paid','2025-10-23 07:35:22',0.00),(11,1,'[{\"id\": 2, \"img\": \"/posters/nachos.jpg\", \"qty\": 1, \"name\": \"Nachosy z sosem\", \"price\": 15}]',15.00,'paid','2025-10-23 07:37:18',0.00),(12,1,'[{\"id\": 2, \"img\": \"/posters/nachos.jpg\", \"qty\": 1, \"name\": \"Nachosy z sosem\", \"price\": 15}]',15.00,'paid','2025-10-23 07:39:49',0.00),(13,1,'[{\"id\": 2, \"img\": \"/posters/nachos.jpg\", \"qty\": 1, \"name\": \"Nachosy z sosem\", \"price\": 15}]',15.00,'paid','2025-10-23 11:22:00',0.00),(14,2,'[{\"id\": 2, \"img\": \"/posters/nachos.jpg\", \"qty\": 1, \"name\": \"Nachosy z sosem\", \"price\": 15}]',15.00,'paid','2025-10-30 12:23:18',0.00),(15,1,'[{\"id\": 1, \"img\": \"/posters/popcorn.jpg\", \"qty\": 1, \"name\": \"Popcorn klasyczny\", \"price\": 12}]',12.00,'paid','2025-11-14 12:06:57',0.00),(16,1,'[{\"id\": 2, \"img\": \"/posters/nachos.jpg\", \"qty\": 1, \"name\": \"Nachosy z sosem\", \"price\": 15}]',15.00,'completed','2025-11-19 16:35:30',0.00),(17,1,'[{\"type\": \"Free Ticket\", \"seats\": \"B7\", \"quantity\": 1}]',0.00,'free','2025-11-26 19:55:08',0.00),(18,1,'[{\"type\": \"Free Ticket\", \"seats\": \"C8\", \"quantity\": 1}]',0.00,'free','2025-11-26 20:11:49',0.00),(19,1,'[{\"type\": \"Free Ticket\", \"seats\": \"A5\", \"quantity\": 1}]',0.00,'free','2025-11-27 10:48:05',0.00),(20,1,'[{\"qty\": 1, \"name\": \"Popcorn + Cola\", \"price\": 0}]',0.00,'free','2025-11-27 10:59:37',0.00),(21,1,'[{\"type\": \"Free Ticket\", \"seats\": \"A8\", \"quantity\": 1}]',0.00,'free','2025-11-27 12:54:21',0.00),(22,1,'[{\"qty\": 1, \"name\": \"Popcorn + Cola\", \"price\": 0}]',0.00,'free','2025-11-27 12:54:40',0.00);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
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
