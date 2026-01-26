-- 週期預約功能資料庫更新腳本
-- Story 1.1: 週期預約資料架構與基礎建立

USE secretariat;

-- 1. 建立 RecurringSeries 表
CREATE TABLE IF NOT EXISTS `RecurringSeries` (
    `series_id` int NOT NULL AUTO_INCREMENT,
    `identifier` varchar(12) NOT NULL,
    `room_id` int NOT NULL,
    `name` varchar(40) NOT NULL,
    `rrule` varchar(255) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `show` boolean NOT NULL,
    `ext` varchar(10),
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`series_id`),
    FOREIGN KEY (`identifier`) REFERENCES `User` (`identifier`),
    FOREIGN KEY (`room_id`) REFERENCES `Room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 新增 Reservation 表的 series_id 欄位 (如果不存在)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'secretariat'
    AND TABLE_NAME = 'Reservation'
    AND COLUMN_NAME = 'series_id');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `Reservation` ADD COLUMN `series_id` int NULL',
    'SELECT "series_id already exists" AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 新增 Reservation 表的 occurrence_date 欄位 (如果不存在)
SET @col_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'secretariat'
    AND TABLE_NAME = 'Reservation'
    AND COLUMN_NAME = 'occurrence_date');

SET @sql2 = IF(@col_exists2 = 0,
    'ALTER TABLE `Reservation` ADD COLUMN `occurrence_date` DATE NULL',
    'SELECT "occurrence_date already exists" AS info');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 4. 新增外鍵約束 (如果不存在)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = 'secretariat'
    AND TABLE_NAME = 'Reservation'
    AND CONSTRAINT_NAME = 'Reservation_ibfk_series');

SET @sql3 = IF(@fk_exists = 0,
    'ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_ibfk_series` FOREIGN KEY (`series_id`) REFERENCES `RecurringSeries`(`series_id`) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" AS info');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- 顯示結果
SELECT 'Database update completed!' AS result;
SHOW TABLES LIKE '%Recurring%';
DESCRIBE `RecurringSeries`;
DESCRIBE `Reservation`;
