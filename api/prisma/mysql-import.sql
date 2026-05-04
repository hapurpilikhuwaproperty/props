SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `PasswordReset`;
DROP TABLE IF EXISTS `OtpCode`;
DROP TABLE IF EXISTS `RefreshToken`;
DROP TABLE IF EXISTS `ShortlistVote`;
DROP TABLE IF EXISTS `ShortlistComment`;
DROP TABLE IF EXISTS `ShortlistItem`;
DROP TABLE IF EXISTS `ShortlistCollaborator`;
DROP TABLE IF EXISTS `Shortlist`;
DROP TABLE IF EXISTS `Visit`;
DROP TABLE IF EXISTS `Favorite`;
DROP TABLE IF EXISTS `Inquiry`;
DROP TABLE IF EXISTS `PropertyAmenity`;
DROP TABLE IF EXISTS `PropertyImage`;
DROP TABLE IF EXISTS `Amenity`;
DROP TABLE IF EXISTS `Property`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Role`;

CREATE TABLE `Role` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Role_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 0,
  `roleId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_roleId_idx` (`roleId`),
  CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Property` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `location` VARCHAR(191) NOT NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `type` ENUM('APARTMENT','VILLA','HOUSE','STUDIO','PLOT','COMMERCIAL') NOT NULL,
  `bedrooms` INT NOT NULL,
  `bathrooms` INT NOT NULL,
  `areaSqFt` DOUBLE NULL,
  `videoUrl` TEXT NULL,
  `status` ENUM('AVAILABLE','PENDING','SOLD') NOT NULL DEFAULT 'AVAILABLE',
  `verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verificationLevel` ENUM('BASIC','REVIEWED','VERIFIED') NOT NULL DEFAULT 'BASIC',
  `listingSource` ENUM('OWNER','AGENT','BUILDER','ADMIN_IMPORT') NOT NULL DEFAULT 'AGENT',
  `qualityScore` INT NOT NULL DEFAULT 60,
  `responseTimeHours` INT NULL,
  `lastVerifiedAt` DATETIME(3) NULL,
  `agentId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Property_location_idx` (`location`),
  KEY `Property_price_idx` (`price`),
  KEY `Property_type_idx` (`type`),
  KEY `Property_agentId_idx` (`agentId`),
  CONSTRAINT `Property_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `PropertyImage` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `url` TEXT NOT NULL,
  `isCover` TINYINT(1) NOT NULL DEFAULT 0,
  `propertyId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PropertyImage_propertyId_idx` (`propertyId`),
  CONSTRAINT `PropertyImage_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Amenity` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Amenity_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `PropertyAmenity` (
  `propertyId` INT NOT NULL,
  `amenityId` INT NOT NULL,
  PRIMARY KEY (`propertyId`, `amenityId`),
  KEY `PropertyAmenity_amenityId_idx` (`amenityId`),
  CONSTRAINT `PropertyAmenity_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PropertyAmenity_amenityId_fkey` FOREIGN KEY (`amenityId`) REFERENCES `Amenity` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Inquiry` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `message` LONGTEXT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `status` ENUM('OPEN','CONTACTED','VISIT_SCHEDULED','NEGOTIATING','CLOSED','LOST') NOT NULL DEFAULT 'OPEN',
  `lastContactedAt` DATETIME(3) NULL,
  `propertyId` INT NULL,
  `userId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Inquiry_propertyId_idx` (`propertyId`),
  KEY `Inquiry_userId_idx` (`userId`),
  CONSTRAINT `Inquiry_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Inquiry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Favorite` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `propertyId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Favorite_userId_propertyId_key` (`userId`, `propertyId`),
  KEY `Favorite_propertyId_idx` (`propertyId`),
  CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Favorite_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Visit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `scheduledAt` DATETIME(3) NOT NULL,
  `status` ENUM('REQUESTED','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  `notes` LONGTEXT NULL,
  `rating` INT NULL,
  `propertyId` INT NOT NULL,
  `userId` INT NOT NULL,
  `agentId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Visit_propertyId_idx` (`propertyId`),
  KEY `Visit_userId_idx` (`userId`),
  KEY `Visit_agentId_idx` (`agentId`),
  CONSTRAINT `Visit_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Visit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Visit_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Shortlist` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `shareToken` VARCHAR(191) NOT NULL,
  `ownerId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Shortlist_shareToken_key` (`shareToken`),
  KEY `Shortlist_ownerId_idx` (`ownerId`),
  CONSTRAINT `Shortlist_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ShortlistCollaborator` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shortlistId` INT NOT NULL,
  `userId` INT NOT NULL,
  `canEdit` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ShortlistCollaborator_shortlistId_userId_key` (`shortlistId`, `userId`),
  KEY `ShortlistCollaborator_userId_idx` (`userId`),
  CONSTRAINT `ShortlistCollaborator_shortlistId_fkey` FOREIGN KEY (`shortlistId`) REFERENCES `Shortlist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ShortlistCollaborator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ShortlistItem` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shortlistId` INT NOT NULL,
  `propertyId` INT NOT NULL,
  `note` LONGTEXT NULL,
  `priority` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ShortlistItem_shortlistId_propertyId_key` (`shortlistId`, `propertyId`),
  KEY `ShortlistItem_propertyId_idx` (`propertyId`),
  CONSTRAINT `ShortlistItem_shortlistId_fkey` FOREIGN KEY (`shortlistId`) REFERENCES `Shortlist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ShortlistItem_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ShortlistComment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shortlistItemId` INT NOT NULL,
  `authorId` INT NOT NULL,
  `body` LONGTEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ShortlistComment_shortlistItemId_idx` (`shortlistItemId`),
  KEY `ShortlistComment_authorId_idx` (`authorId`),
  CONSTRAINT `ShortlistComment_shortlistItemId_fkey` FOREIGN KEY (`shortlistItemId`) REFERENCES `ShortlistItem` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ShortlistComment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ShortlistVote` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shortlistItemId` INT NOT NULL,
  `userId` INT NOT NULL,
  `value` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ShortlistVote_shortlistItemId_userId_key` (`shortlistItemId`, `userId`),
  KEY `ShortlistVote_userId_idx` (`userId`),
  CONSTRAINT `ShortlistVote_shortlistItemId_fkey` FOREIGN KEY (`shortlistItemId`) REFERENCES `ShortlistItem` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ShortlistVote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `RefreshToken` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tokenHash` VARCHAR(191) NOT NULL,
  `userId` INT NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `revoked` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RefreshToken_tokenHash_key` (`tokenHash`),
  KEY `RefreshToken_userId_idx` (`userId`),
  CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `OtpCode` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `expiresAt` DATETIME(3) NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `PasswordReset` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tokenHash` VARCHAR(191) NOT NULL,
  `userId` INT NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PasswordReset_tokenHash_key` (`tokenHash`),
  KEY `PasswordReset_userId_idx` (`userId`),
  CONSTRAINT `PasswordReset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Role` (`name`) VALUES
  ('Admin'),
  ('Agent'),
  ('User')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;
