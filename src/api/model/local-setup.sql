-- 本地開發環境資料庫初始化腳本
-- 使用方式: mysql -u root -p < local-setup.sql

-- 建立資料庫
CREATE DATABASE IF NOT EXISTS `secretariat` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `secretariat`;

-- 建立本地開發用使用者 (可自行修改密碼)
CREATE USER IF NOT EXISTS 'mrbs_user'@'localhost' IDENTIFIED BY 'mrbs_password';
GRANT ALL PRIVILEGES ON secretariat.* TO 'mrbs_user'@'localhost';
FLUSH PRIVILEGES;

-- =====================
-- 資料表建立
-- =====================

-- 使用者表
CREATE TABLE IF NOT EXISTS `User` (
  `identifier` varchar(12) NOT NULL,
  `chinesename` varchar(20) DEFAULT NULL,
  `email` varchar(35) DEFAULT NULL,
  `mobilePhone` varchar(12) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `privilege_level` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作類型表
CREATE TABLE IF NOT EXISTS `Operation` (
  `operation_id` int NOT NULL AUTO_INCREMENT,
  `operation_name` varchar(40) NOT NULL,
  PRIMARY KEY (`operation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 日誌表
CREATE TABLE IF NOT EXISTS `Log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `identifier` varchar(12) NOT NULL,
  `datetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `IP` varchar(15) NOT NULL,
  `operation_id` int NOT NULL,
  PRIMARY KEY (`log_id`),
  FOREIGN KEY (`identifier`) REFERENCES `User` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `identifier_time` ON `Log` (`identifier`, `datetime`);

-- 違規記錄表
CREATE TABLE IF NOT EXISTS `Violation` (
  `violation_id` int NOT NULL AUTO_INCREMENT,
  `identifier` varchar(12) NOT NULL,
  `datetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `reason` varchar(200) NOT NULL,
  `remark` varchar(200) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`violation_id`),
  FOREIGN KEY (`identifier`) REFERENCES `User` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 會議室表
CREATE TABLE IF NOT EXISTS `Room` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `room_name` varchar(20) NOT NULL,
  `room_status` boolean NOT NULL,
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 預約表
CREATE TABLE IF NOT EXISTS `Reservation` (
  `reserve_id` int NOT NULL AUTO_INCREMENT,
  `identifier` varchar(12) NOT NULL,
  `room_id` int NOT NULL,
  `name` varchar(40) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `show` boolean NOT NULL,
  `ext` varchar(10),
  `status` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`reserve_id`),
  FOREIGN KEY (`identifier`) REFERENCES `User` (`identifier`),
  FOREIGN KEY (`room_id`) REFERENCES `Room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文件表
CREATE TABLE IF NOT EXISTS `Doc` (
  `name` varchar(40) NOT NULL,
  `blocks` longtext NOT NULL,
  `id_content` varchar(200) NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 預設資料
-- =====================

-- 管理員帳號
INSERT IGNORE INTO `User` (`identifier`, `chinesename`, `email`, `mobilePhone`, `unit`, `status`, `privilege_level`)
VALUES ('admin', '管理員', 'admin@example.com', '0912345678', 'NCU-IM', 1, 1);

-- 測試用一般使用者
INSERT IGNORE INTO `User` (`identifier`, `chinesename`, `email`, `mobilePhone`, `unit`, `status`, `privilege_level`)
VALUES ('testuser', '測試使用者', 'test@example.com', '0987654321', 'NCU-CS', 1, 0);

-- 操作類型
INSERT IGNORE INTO `Operation` (`operation_id`, `operation_name`) VALUES (1, 'login successfully'), (2, 'login failed'), (3, 'logout');

-- 會議室
INSERT IGNORE INTO `Room` (`room_id`, `room_name`, `room_status`) VALUES (1, '二樓會議室', true);

-- 測試預約 (2025年資料)
INSERT IGNORE INTO `Reservation` (`reserve_id`, `identifier`, `room_id`, `name`, `start_time`, `end_time`, `show`, `ext`, `status`)
VALUES (1, 'admin', 1, '系統測試會議', '2025-02-01 10:00:00', '2025-02-01 12:00:00', true, '578', 1);

SELECT '資料庫初始化完成！' AS message;
