-- AlterTable: add balance to Account
ALTER TABLE "Account" ADD COLUMN "balance" DECIMAL(12,2) NOT NULL DEFAULT 0;
