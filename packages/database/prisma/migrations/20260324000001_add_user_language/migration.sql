-- AlterTable: add language preference to User
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
