/**
 * Supabase client factory for Edge Functions.
 * Provides both service-role (admin) and auth (user-scoped) clients,
 * plus a helper to fetch the user's company_id for multi-tenant scoping.
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Creates a Supabase client with the service role key.
 * This client bypasses RLS and has full database access.
 * Use for agent operations that run without a user context (e.g., cron-triggered).
 */
export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase client authenticated with the user's JWT.
 * Uses the anon key but passes the user's Authorization header for RLS enforcement.
 * Use for operations where the user's identity and permissions matter.
 */
export function createAuthClient(req: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  return createClient(url, key, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

/**
 * Fetches the company_id for a given user from the profiles table.
 * Every agent operation must be scoped to a company_id for multi-tenant isolation.
 *
 * @throws Error if the user profile is not found or has no company_id
 */
export async function getCompanyId(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.company_id) {
    throw new Error(
      `User profile not found or missing company_id for user ${userId}`
    );
  }

  return profile.company_id;
}
