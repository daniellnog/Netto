-- CreateTable: Bill
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,         -- "income" | "expense"
    "recurrence" TEXT NOT NULL,   -- "once" | "weekly" | "monthly" | "yearly"
    "dueDay" INTEGER,             -- day of month (1-31) for monthly recurrence
    "startDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BillPayment (one row per payment instance)
CREATE TABLE "BillPayment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "billId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',  -- "pending" | "paid" | "overdue"
    "transactionId" TEXT,                       -- linked Transaction when paid
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: cascade so deleting a Bill removes all its payments
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_billId_fkey"
    FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
