import { useState, useEffect } from "react";
import { useAuth } from "../store/AuthContext";
import { supabase } from "../services/supabase";

export function useGoals() {
  const { user }              = useAuth();
  const [goals, setGoals]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setGoals(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const grouped = {
    big:       goals.filter(g => g.type === "big"),
    longterm:  goals.filter(g => g.type === "longterm"),
    shortterm: goals.filter(g => g.type === "shortterm"),
  };

  const add = async (goal) => {
  if (!user) return;
  const { data, error } = await supabase
    .from("goals")
    .insert({ user_id: user.id, ...goal })
    .select()
    .single();
  if (error) {
    console.error("Goal insert failed:", error.message);
    return;
  }
  if (data) setGoals(gs => [...gs, data]);
};

  const update = async (id, updates) => {
    const { data } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (data) setGoals(gs => gs.map(g => g.id === id ? data : g));
  };

  const remove = async (id) => {
    await supabase.from("goals").delete().eq("id", id);
    setGoals(gs => gs.filter(g => g.id !== id));
  };

  const logProgress = async (id, amount) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const next = Math.min(goal.target, goal.progress + amount);
    await update(id, { progress: next, done: next >= goal.target });
  };

  return { goals, grouped, loading, add, update, remove, logProgress };
}
