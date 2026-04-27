-- Add status to Transaction: "confirmed" (affects balance) | "pending" (does not)
ALTER TABLE "Transaction" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'confirmed';
