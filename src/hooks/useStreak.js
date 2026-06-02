import { useEffect } from "react";
import { useAuth }  from "../store/AuthContext";
import { supabase } from "../services/supabase";

export function useStreak() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Call the streak update function on every app load
    supabase.rpc("update_streak", { user_id: user.id });
  }, [user]);
}