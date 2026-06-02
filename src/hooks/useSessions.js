import { useState, useEffect } from "react";
import { useAuth } from "../store/AuthContext";
import { supabase } from "../services/supabase";

export function useSessions() {
  const { user }                = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("pomodoro_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        setSessions(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const add = async (taskName, durationMinutes) => {
    if (!user) return;
    const { data } = await supabase
      .from("pomodoro_sessions")
      .insert({ user_id: user.id, task_name: taskName, duration_minutes: durationMinutes })
      .select()
      .single();
    if (data) setSessions(s => [data, ...s]);
  };

  const today        = new Date().toDateString();
  const todayList    = sessions.filter(s => new Date(s.completed_at).toDateString() === today);
  const todaySessions  = todayList.length;
  const todayMinutes   = todayList.reduce((a, s) => a + (s.duration_minutes ?? 0), 0);

  return { sessions, loading, add, todaySessions, todayMinutes };
}
