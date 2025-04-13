-- Create a minimal users table that only stores authentication data and public keys
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  eth_address VARCHAR(42) NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an RLS policy to secure the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own data
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to insert their own data (for registration)
CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to access all data
CREATE POLICY "Service role can do anything" ON public.users
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow anon role to insert during signup flow
CREATE POLICY "Anon can insert during signup" ON public.users
  FOR INSERT WITH CHECK (true);

-- Create a function to create user profiles that bypasses RLS
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  eth_address TEXT,
  public_key TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (user_id, eth_address, public_key)
  VALUES (user_id, eth_address, public_key);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an index for wallet addresses
CREATE INDEX IF NOT EXISTS idx_users_eth_address ON public.users(eth_address); 