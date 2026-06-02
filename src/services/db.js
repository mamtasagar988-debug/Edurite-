import { supabase } from "./supabase";

/* ─── Profile ────────────────────────────────────────────────────── */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}

/* ─── Todos ──────────────────────────────────────────────────────── */
export async function getTodos(userId) {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return { data, error };
}

export async function addTodo(userId, text, priority = "medium") {
  const { data, error } = await supabase
    .from("todos")
    .insert({ user_id: userId, text, priority })
    .select()
    .single();
  return { data, error };
}

export async function updateTodo(id, updates) {
  const { data, error } = await supabase
    .from("todos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteTodo(id) {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  return { error };
}

/* ─── Goals ──────────────────────────────────────────────────────── */
export async function getGoals(userId) {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return { data, error };
}

export async function addGoal(userId, goal) {
  const { data, error } = await supabase
    .from("goals")
    .insert({ user_id: userId, ...goal })
    .select()
    .single();
  return { data, error };
}

export async function updateGoal(id, updates) {
  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteGoal(id) {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  return { error };
}

/* ─── Pomodoro sessions ──────────────────────────────────────────── */
export async function getSessions(userId) {
  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  return { data, error };
}

export async function addSession(userId, taskName, durationMinutes) {
  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .insert({ user_id: userId, task_name: taskName, duration_minutes: durationMinutes })
    .select()
    .single();
  return { data, error };
}

/* ─── Friends ────────────────────────────────────────────────────── */
export async function getFriends(userId) {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      *,
      user:user_id   ( id, profiles(full_name) ),
      friend:friend_id ( id, profiles(full_name) )
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted");
  return { data, error };
}

export async function getFriendRequests(userId) {
  const { data, error } = await supabase
    .from("friends")
    .select(`
      *,
      user:user_id ( id, profiles(full_name) )
    `)
    .eq("friend_id", userId)
    .eq("status", "pending");
  return { data, error };
}

export async function sendFriendRequest(userId, friendId) {
  const { data, error } = await supabase
    .from("friends")
    .insert({ user_id: userId, friend_id: friendId, status: "pending" })
    .select()
    .single();
  return { data, error };
}

export async function acceptFriendRequest(id) {
  const { data, error } = await supabase
    .from("friends")
    .update({ status: "accepted" })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function removeFriend(id) {
  const { error } = await supabase.from("friends").delete().eq("id", id);
  return { error };
}

/* ─── Messages ───────────────────────────────────────────────────── */
export async function getMessages(channel, limit = 50) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles(full_name)")
    .eq("channel", channel)
    .order("created_at", { ascending: true })
    .limit(limit);
  return { data, error };
}

export async function sendMessage(userId, channel, text) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ user_id: userId, channel, text })
    .select("*, profiles(full_name)")
    .single();
  return { data, error };
}

export function subscribeToMessages(channel, callback) {
  return supabase
    .channel(`messages:${channel}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `channel=eq.${channel}`,
    }, callback)
    .subscribe();
}
