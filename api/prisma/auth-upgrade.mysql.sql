-- Apply this once before deploying the multi-method auth backend to MySQL.
-- Review phone duplicates before adding User_phone_key.

INSERT IGNORE INTO `Role` (`name`) VALUES ('Admin'), ('Seller'), ('Guest'), ('Agent'), ('User');

ALTER TABLE `User`
  MODIFY `email` VARCHAR(191) NULL,
  MODIFY `password` VARCHAR(191) NULL,
  MODIFY `phone` VARCHAR(191) NULL,
  ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `sellerVerificationStatus` ENUM('NOT_REQUESTED','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'NOT_REQUESTED',
  ADD COLUMN `sellerVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `authProvider` ENUM('PASSWORD','EMAIL_MAGIC','PHONE_OTP','GOOGLE') NOT NULL DEFAULT 'PASSWORD',
  ADD COLUMN `googleSubject` VARCHAR(191) NULL,
  ADD COLUMN `mfaEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `mfaSecret` VARCHAR(191) NULL,
  ADD COLUMN `mfaVerifiedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `User_phone_key` ON `User` (`phone`);
CREATE UNIQUE INDEX `User_googleSubject_key` ON `User` (`googleSubject`);

CREATE TABLE `AuthSession` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deviceId` VARCHAR(191) NOT NULL,
  `userId` INT NOT NULL,
  `userAgent` VARCHAR(191) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AuthSession_deviceId_key` (`deviceId`),
  KEY `AuthSession_userId_idx` (`userId`),
  CONSTRAINT `AuthSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `RefreshToken`
  ADD COLUMN `sessionId` INT NULL,
  ADD COLUMN `revokedAt` DATETIME(3) NULL,
  ADD COLUMN `lastUsedAt` DATETIME(3) NULL,
  ADD KEY `RefreshToken_sessionId_idx` (`sessionId`),
  ADD CONSTRAINT `RefreshToken_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `AuthSession` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `OtpCode`
  MODIFY `email` VARCHAR(191) NULL,
  ADD COLUMN `identifier` VARCHAR(191) NULL,
  ADD COLUMN `channel` ENUM('EMAIL','PHONE') NOT NULL DEFAULT 'EMAIL';

UPDATE `OtpCode` SET `identifier` = LOWER(`email`) WHERE `identifier` IS NULL;

ALTER TABLE `OtpCode`
  MODIFY `identifier` VARCHAR(191) NOT NULL,
  ADD KEY `OtpCode_identifier_channel_idx` (`identifier`, `channel`);

CREATE TABLE `MagicLinkToken` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tokenHash` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MagicLinkToken_tokenHash_key` (`tokenHash`),
  KEY `MagicLinkToken_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `AuthChallenge` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `challengeId` VARCHAR(191) NOT NULL,
  `userId` INT NOT NULL,
  `type` ENUM('ADMIN_MFA_LOGIN','ADMIN_MFA_SETUP') NOT NULL,
  `secret` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AuthChallenge_challengeId_key` (`challengeId`),
  KEY `AuthChallenge_userId_idx` (`userId`),
  CONSTRAINT `AuthChallenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
