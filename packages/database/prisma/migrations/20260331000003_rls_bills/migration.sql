-- Enable RLS on new tables
ALTER TABLE "Bill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillPayment" ENABLE ROW LEVEL SECURITY;

-- ── Bill ──────────────────────────────────────────────────────────────────────

CREATE POLICY "bill_select"
  ON "Bill" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "bill_insert"
  ON "Bill" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "bill_update"
  ON "Bill" FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "bill_delete"
  ON "Bill" FOR DELETE
  USING (auth.uid()::text = "userId");

-- ── BillPayment ───────────────────────────────────────────────────────────────

CREATE POLICY "billpayment_select"
  ON "BillPayment" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "billpayment_insert"
  ON "BillPayment" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "billpayment_update"
  ON "BillPayment" FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "billpayment_delete"
  ON "BillPayment" FOR DELETE
  USING (auth.uid()::text = "userId");
