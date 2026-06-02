import { useState, useEffect } from "react";
import { useAuth } from "../store/AuthContext";
import { supabase } from "../services/supabase";

export function useProfile() {
  const { user }              = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  const update = async (updates) => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (data) setProfile(data);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const displayName = profile?.full_name
  ?? user?.user_metadata?.full_name
  ?? user?.email
  ?? "Student";

  return { profile, loading, update, initials, displayName };
}
