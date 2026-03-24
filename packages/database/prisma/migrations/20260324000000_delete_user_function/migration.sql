-- CreateFunction: delete_user
-- Deletes all data associated with the calling user, then removes the auth entry.
-- Must be called via supabase.rpc('delete_user') from an authenticated session.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid TEXT := auth.uid()::TEXT;
BEGIN
  -- 1. No FK dependencies
  DELETE FROM public."SpendingLimit" WHERE "userId" = uid;

  -- 2. FK to Category (nullable, SET NULL not defined — delete before Category)
  DELETE FROM public."Transaction" WHERE "userId" = uid;

  -- 3. FK to Account (defaultAccountId SET NULL handled by constraint, but userId RESTRICT)
  DELETE FROM public."CreditCard" WHERE "userId" = uid;

  -- 4. No remaining dependencies
  DELETE FROM public."Category" WHERE "userId" = uid;

  -- 5. No remaining dependencies
  DELETE FROM public."Account" WHERE "userId" = uid;

  -- 6. Remove from public User table
  DELETE FROM public."User" WHERE "id" = uid;

  -- 7. Remove from Supabase auth (requires SECURITY DEFINER + superuser grant)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
