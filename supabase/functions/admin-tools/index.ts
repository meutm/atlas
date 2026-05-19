import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const protectedUsernames = new Set(["admin.meu"]);
const baselineMemberIds = new Set(Array.from({ length: 22 }, (_, index) => `MEM-${String(index + 1).padStart(4, "0")}`));

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
      auth: { persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
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
      .select("role, username")
      .eq("id", user.id)
      .single();

    if (profileError || requester?.role !== "Admin") {
      return json({ error: "Doar Admin poate șterge date." }, 403);
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "delete-record") {
      const entity = String(body.entity || "");
      const id = String(body.id || "").trim();
      if (!entity || !id) return json({ error: "Entity și id sunt obligatorii." }, 400);
      const deleted = await deleteRecord(adminClient, entity, id, user.id);
      return json({ ok: true, deleted });
    }

    if (action === "reset-test-data") {
      const result = await resetTestData(adminClient);
      return json({ ok: true, ...result });
    }

    return json({ error: "Acțiune necunoscută." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Eroare necunoscută." }, 500);
  }
});

async function deleteRecord(adminClient: ReturnType<typeof createClient>, entity: string, id: string, requesterId: string) {
  if (entity === "task") {
    await updateWhere(adminClient, "operational_logs", { related_task_id: null }, "related_task_id", id);
    await updateWhere(adminClient, "time_entries", { related_task_id: null }, "related_task_id", id);
    await deleteRelatedFiles(adminClient, "Task", id);
    return deleteWhere(adminClient, "tasks", "id", id);
  }

  if (entity === "log") {
    await updateWhere(adminClient, "tasks", { related_log_id: null }, "related_log_id", id);
    await updateWhere(adminClient, "time_entries", { related_log_id: null }, "related_log_id", id);
    await deleteRelatedFiles(adminClient, "Log", id);
    return deleteWhere(adminClient, "operational_logs", "id", id);
  }

  if (entity === "time") {
    await deleteRelatedFiles(adminClient, "Pontaj", id);
    return deleteWhere(adminClient, "time_entries", "id", id);
  }

  if (entity === "risk") {
    await deleteRelatedFiles(adminClient, "Risc", id);
    return deleteWhere(adminClient, "risks", "id", id);
  }

  if (entity === "file") {
    return deleteWhere(adminClient, "files", "id", id);
  }

  if (entity === "registry") {
    await deleteRelatedFiles(adminClient, "Registratură", id);
    return deleteWhere(adminClient, "registry_entries", "id", id);
  }

  if (entity === "member") {
    if (baselineMemberIds.has(id)) {
      throw new Error("Membrii de bază nu se șterg din resetul de test.");
    }
    await clearMemberReferences(adminClient, id);
    return deleteWhere(adminClient, "members", "id", id);
  }

  if (entity === "account") {
    const { data: profile, error } = await adminClient.from("profiles").select("id, username").eq("username", id).maybeSingle();
    if (error) throw error;
    if (!profile) throw new Error("Contul nu există în profiles.");
    if (protectedUsernames.has(profile.username)) throw new Error("Cont protejat.");
    if (profile.id === requesterId) throw new Error("Nu îți poți șterge propriul cont.");
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(profile.id);
    if (deleteError) throw deleteError;
    return 1;
  }

  throw new Error("Tip de înregistrare necunoscut.");
}

async function resetTestData(adminClient: ReturnType<typeof createClient>) {
  const counts: Record<string, number> = {};
  const warnings: string[] = [];

  counts.files = await deleteAllCreatedRows(adminClient, "files");
  counts.timeEntries = await deleteAllCreatedRows(adminClient, "time_entries");
  counts.registryHistory = await deleteAllCreatedRows(adminClient, "registry_history");
  counts.registryEntries = await deleteAllCreatedRows(adminClient, "registry_entries");
  counts.risks = await deleteAllCreatedRows(adminClient, "risks");
  counts.logs = await deleteAllCreatedRows(adminClient, "operational_logs");
  counts.tasks = await deleteAllCreatedRows(adminClient, "tasks");

  const { data: profiles, error: profilesError } = await adminClient.from("profiles").select("id, username");
  if (profilesError) throw profilesError;
  for (const profile of profiles || []) {
    if (protectedUsernames.has(profile.username)) continue;
    const { error } = await adminClient.auth.admin.deleteUser(profile.id);
    if (error) warnings.push(`Auth user ${profile.username}: ${error.message}`);
    const { error: profileDeleteError } = await adminClient.from("profiles").delete().eq("id", profile.id);
    if (profileDeleteError) throw profileDeleteError;
  }
  counts.profiles = (profiles || []).filter((profile) => !protectedUsernames.has(profile.username)).length;

  const { data: members, error: membersError } = await adminClient.from("members").select("id");
  if (membersError) throw membersError;
  let memberCount = 0;
  for (const member of members || []) {
    if (baselineMemberIds.has(member.id)) continue;
    await clearMemberReferences(adminClient, member.id);
    memberCount += await deleteWhere(adminClient, "members", "id", member.id);
  }
  counts.members = memberCount;

  const { error: sequenceError } = await adminClient.rpc("reset_registry_sequence");
  if (sequenceError) warnings.push(`registry_sequence: ${sequenceError.message}`);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return {
    counts,
    warnings,
    message: `${total} înregistrări de test au fost curățate.`,
  };
}

async function clearMemberReferences(adminClient: ReturnType<typeof createClient>, memberId: string) {
  await updateWhere(adminClient, "profiles", { member_id: null }, "member_id", memberId);
  await updateWhere(adminClient, "role_assignments", { member_id: null, status: "Neocupat" }, "member_id", memberId);
  await updateWhere(adminClient, "tasks", { owner_id: null }, "owner_id", memberId);
  await updateWhere(adminClient, "operational_logs", { submitted_by: null }, "submitted_by", memberId);
  await updateWhere(adminClient, "operational_logs", { follow_up_owner_id: null }, "follow_up_owner_id", memberId);
  await updateWhere(adminClient, "time_entries", { member_id: null }, "member_id", memberId);
  await updateWhere(adminClient, "time_entries", { validated_by: null }, "validated_by", memberId);
  await updateWhere(adminClient, "risks", { owner_id: null }, "owner_id", memberId);
  await updateWhere(adminClient, "files", { uploaded_by: null }, "uploaded_by", memberId);
  await updateWhere(adminClient, "registry_entries", { requester_id: null }, "requester_id", memberId);
  await updateWhere(adminClient, "registry_history", { actor_id: null }, "actor_id", memberId);
}

async function updateWhere(adminClient: ReturnType<typeof createClient>, table: string, patch: Record<string, unknown>, column: string, value: string) {
  const { error } = await adminClient.from(table).update(patch).eq(column, value);
  if (error) throw error;
}

async function deleteWhere(adminClient: ReturnType<typeof createClient>, table: string, column: string, value: string) {
  const { count, error } = await adminClient.from(table).delete({ count: "exact" }).eq(column, value);
  if (error) throw error;
  return count ?? 0;
}

async function deleteRelatedFiles(adminClient: ReturnType<typeof createClient>, relatedType: string, relatedId: string) {
  const { error } = await adminClient.from("files").delete().eq("related_type", relatedType).eq("related_id", relatedId);
  if (error) throw error;
}

async function deleteAllCreatedRows(adminClient: ReturnType<typeof createClient>, table: string) {
  const { count, error } = await adminClient.from(table).delete({ count: "exact" }).gte("created_at", "1900-01-01");
  if (error) throw error;
  return count ?? 0;
}

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
