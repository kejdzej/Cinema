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
-- Table structure for table `loyalty_history`
--

DROP TABLE IF EXISTS `loyalty_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `change_amount` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `points` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `loyalty_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_history`
--

LOCK TABLES `loyalty_history` WRITE;
/*!40000 ALTER TABLE `loyalty_history` DISABLE KEYS */;
INSERT INTO `loyalty_history` VALUES (1,1,100,'Zakup biletu','2025-11-21 14:24:09',0),(2,1,100,'Zakup biletu','2025-11-21 14:24:48',0),(3,1,-50,'Redeem reward','2025-11-21 14:35:07',0),(4,1,-100,'Redeem reward','2025-11-21 14:35:09',0),(5,1,-50,'Redeem reward','2025-11-21 14:35:12',0),(6,1,-100,'Redeem reward','2025-11-21 14:36:29',0),(7,1,-100,'Redeem reward','2025-11-21 14:36:31',0),(8,1,100,'Zakup biletu','2025-11-26 15:11:26',0),(9,1,100,'Zakup biletu','2025-11-26 15:11:27',0),(10,1,100,'Zakup biletu','2025-11-26 15:11:27',0),(11,1,100,'Zakup biletu','2025-11-26 15:11:27',0),(12,1,100,'Zakup biletu','2025-11-26 15:11:57',0),(13,1,100,'Zakup biletu','2025-11-26 15:11:57',0),(14,1,-500,'Redeem reward','2025-11-26 15:12:17',0),(15,1,100,'Zakup biletu','2025-11-26 19:39:42',0),(16,1,100,'Zakup biletu','2025-11-26 19:41:28',0),(17,1,100,'Zakup biletu','2025-11-26 19:41:53',0),(18,1,100,'Zakup biletu','2025-11-26 19:42:16',0),(19,1,-500,'Bilet gratis','2025-11-26 19:42:40',0),(20,1,-500,'Bilet gratis','2025-11-26 19:48:04',0),(21,1,-500,'Bilet gratis','2025-11-26 19:51:15',0),(22,1,-500,'Bilet gratis','2025-11-26 19:53:08',0),(23,1,-500,'Bilet gratis','2025-11-26 19:55:03',0),(24,1,-300,'Redeem reward','2025-11-26 19:57:04',0),(25,1,-100,'Redeem reward','2025-11-26 19:57:06',0),(26,1,-100,'Redeem reward','2025-11-26 19:57:09',0),(27,1,-500,'Bilet gratis','2025-11-26 20:11:43',0),(28,1,100,'Zakup biletu','2025-11-27 10:46:32',0),(29,1,100,'Zakup biletu','2025-11-27 10:46:34',0),(30,1,100,'Zakup biletu','2025-11-27 10:47:09',0),(31,1,-1000,'Redeem reward','2025-11-27 10:47:38',0),(32,1,-500,'Bilet gratis','2025-11-27 10:47:45',0),(33,1,-300,'Popcorn + Cola gratis','2025-11-27 10:53:08',0),(34,1,-300,'Popcorn + Cola gratis','2025-11-27 10:53:30',0),(35,1,-300,'Popcorn + Cola gratis','2025-11-27 10:59:37',0),(36,1,100,'Zakup biletu','2025-11-27 12:53:50',0),(37,1,-500,'Bilet gratis','2025-11-27 12:54:13',0),(38,1,-300,'Popcorn + Cola gratis','2025-11-27 12:54:40',0);
/*!40000 ALTER TABLE `loyalty_history` ENABLE KEYS */;
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
