-- AlterTable: link Transaction to the Account it affects
ALTER TABLE "Transaction" ADD COLUMN "accountId" TEXT;

-- AddForeignKey (SET NULL so deleting an account doesn't cascade-delete transactions)
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
