import { useState, useEffect, useCallback } from "react";
import { useAuth }  from "../store/AuthContext";
import { supabase } from "../services/supabase";

export function useFriends() {
  const { user }                        = useAuth();
  const [friends,  setFriends]          = useState([]);
  const [requests, setRequests]         = useState({ incoming:[], outgoing:[] });
  const [loading,  setLoading]          = useState(true);
  const [sentIds,  setSentIds]          = useState(new Set());

  /* ── Load all friend data ── */
  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    /* Accepted friends — we're either the initiator or the recipient */
    const { data: accepted } = await supabase
      .from("friends")
      .select("id, user_id, friend_id, status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted");

    /* Fetch profiles for each friend */
    const friendIds = (accepted ?? []).map(f =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    let friendProfiles = [];
    if (friendIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, grade, subject")
        .in("id", friendIds);
      friendProfiles = data ?? [];
    }

    const normalised = (accepted ?? []).map(f => {
      const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
      const profile = friendProfiles.find(p => p.id === otherId) ?? {};
      return { friendshipId: f.id, ...profile };
    });
    setFriends(normalised);

    /* Incoming requests */
    const { data: inc } = await supabase
      .from("friends")
      .select("id, user_id")
      .eq("friend_id", user.id)
      .eq("status", "pending");

    let incProfiles = [];
    if ((inc ?? []).length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, grade, subject")
        .in("id", inc.map(r => r.user_id));
      incProfiles = data ?? [];
    }

    const incoming = (inc ?? []).map(r => ({
      requestId: r.id,
      ...incProfiles.find(p => p.id === r.user_id),
    }));

    /* Outgoing requests */
    const { data: out } = await supabase
      .from("friends")
      .select("id, friend_id")
      .eq("user_id", user.id)
      .eq("status", "pending");

    let outProfiles = [];
    if ((out ?? []).length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, grade, subject")
        .in("id", out.map(r => r.friend_id));
      outProfiles = data ?? [];
    }

    const outgoing = (out ?? []).map(r => ({
      requestId: r.id,
      ...outProfiles.find(p => p.id === r.friend_id),
    }));

    setRequests({ incoming, outgoing });

    /* Track sent ids so Discover tab shows "Sent" state */
    setSentIds(new Set(out?.map(r => r.friend_id) ?? []));

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /* ── Actions ── */
  const sendRequest = async (friendId) => {
    if (!user) return;
    setSentIds(prev => new Set([...prev, friendId]));
    const { error } = await supabase
      .from("friends")
      .insert({ user_id: user.id, friend_id: friendId, status: "pending" });
    if (error) {
      setSentIds(prev => { const s = new Set(prev); s.delete(friendId); return s; });
      console.error("Friend request failed:", error.message);
    }
  };

  const acceptRequest = async (requestId) => {
    await supabase.from("friends").update({ status:"accepted" }).eq("id", requestId);
    load();
  };

  const declineRequest = async (requestId) => {
    await supabase.from("friends").delete().eq("id", requestId);
    load();
  };

  const removeFriend = async (friendshipId) => {
    await supabase.from("friends").delete().eq("id", friendshipId);
    load();
  };

  /* ── Search other users ── */
  const searchUsers = async (query) => {
    if (!query.trim() || !user) return [];
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, grade, subject")
      .ilike("full_name", `%${query}%`)
      .neq("id", user.id)
      .limit(12);
    return data ?? [];
  };

  return {
    friends, requests, loading, sentIds,
    sendRequest, acceptRequest, declineRequest, removeFriend, searchUsers,
  };
}
