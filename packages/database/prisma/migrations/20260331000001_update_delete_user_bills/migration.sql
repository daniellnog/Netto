-- Update delete_user function to also remove Bill and BillPayment records
-- BillPayment must be deleted before Bill (FK constraint), and both before User.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid TEXT := auth.uid()::TEXT;
BEGIN
  -- 1. No FK dependencies on other user tables
  DELETE FROM public."SpendingLimit" WHERE "userId" = uid;

  -- 2. BillPayment references Bill (CASCADE) and User (RESTRICT) — delete first
  DELETE FROM public."BillPayment" WHERE "userId" = uid;

  -- 3. Bill references User (RESTRICT)
  DELETE FROM public."Bill" WHERE "userId" = uid;

  -- 4. Transaction references User and Category
  DELETE FROM public."Transaction" WHERE "userId" = uid;

  -- 5. CreditCard references User and Account
  DELETE FROM public."CreditCard" WHERE "userId" = uid;

  -- 6. Category references User
  DELETE FROM public."Category" WHERE "userId" = uid;

  -- 7. Account references User
  DELETE FROM public."Account" WHERE "userId" = uid;

  -- 8. Public User record
  DELETE FROM public."User" WHERE "id" = uid;

  -- 9. Supabase auth entry (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
