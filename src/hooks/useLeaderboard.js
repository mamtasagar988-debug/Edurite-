import { useState, useEffect } from "react";
import { useAuth }  from "../store/AuthContext";
import { supabase } from "../services/supabase";

export function useLeaderboard() {
  const { user }                        = useAuth();
  const [rankings,    setRankings]      = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [myBreakdown, setMyBreakdown]   = useState(null);

  /* ── Load leaderboard from Supabase function ── */
  useEffect(() => {
    supabase
      .rpc("get_leaderboard")
      .then(({ data, error }) => {
        if (error) {
          console.error("Leaderboard error:", error.message);
          setLoading(false);
          return;
        }
        setRankings(data ?? []);
        setLoading(false);
      });
  }, []);

  /* ── Enrich rankings with isMe flag ── */
  const enriched = rankings.map(r => ({
    ...r,
    isMe: r.id === user?.id,
  }));

  const me     = enriched.find(r => r.isMe) ?? null;
  const myRank = me?.rank ?? null;
  const maxXp  = enriched[0]?.total_xp ?? 1;

  /* ── Load current user's XP breakdown ── */
  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase
        .from("pomodoro_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id),
      supabase
        .from("goals")
        .select("id")
        .eq("user_id", user.id)
        .eq("done", true),
      supabase
        .from("profiles")
        .select("streak")
        .eq("id", user.id)
        .single(),
    ]).then(([sessions, goals, profile]) => {
      const sessionXp = (sessions.data?.length ?? 0) * 50;
      const goalXp    = (goals.data?.length    ?? 0) * 100;
      const streakXp  = (profile.data?.streak  ?? 0) * 10;
      setMyBreakdown({ sessionXp, goalXp, streakXp });
    });
  }, [user]);

  return { rankings: enriched, loading, myRank, maxXp, myBreakdown };
}
