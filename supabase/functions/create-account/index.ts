import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERNAME_DOMAIN = "meu-atlas.local";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? readDefaultKey("SUPABASE_PUBLISHABLE_KEYS");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? readDefaultKey("SUPABASE_SECRET_KEYS");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Neautentificat." }, 401);
    }

    const { data: requester, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || requester?.role !== "Admin") {
      return json({ error: "Doar Admin poate crea conturi." }, 403);
    }

    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.name || "").trim();
    const role = String(body.role || "Head");
    const memberId = body.memberId || null;
    const departmentScope = String(body.scope || "Comunicare");

    if (!username || !password || !displayName) {
      return json({ error: "Username, parola si numele sunt obligatorii." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: `${username}@${USERNAME_DOMAIN}`,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName },
    });

    if (createError || !created.user) {
      return json({ error: createError?.message || "Nu am putut crea userul." }, 400);
    }

    const { error: insertError } = await adminClient.from("profiles").insert({
      id: created.user.id,
      username,
      display_name: displayName,
      role,
      member_id: memberId || null,
      department_scope: departmentScope,
      status: "Activ",
    });

    if (insertError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: insertError.message }, 400);
    }

    return json({ ok: true, username, id: created.user.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Eroare necunoscuta." }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function readDefaultKey(envName: string) {
  try {
    const raw = Deno.env.get(envName);
    if (!raw) return undefined;
    const keys = JSON.parse(raw) as Record<string, unknown>;
    if (typeof keys.default === "string") return keys.default;
    return Object.values(keys).find((value): value is string => typeof value === "string");
  } catch {
    return undefined;
  }
}
