import { useState, useEffect } from "react";
import { useAuth } from "../store/AuthContext";
import { supabase } from "../services/supabase";

export function useTodos() {
  const { user }              = useAuth();
  const [todos, setTodos]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setTodos(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const add = async (text, priority = "medium") => {
    if (!user || !text.trim()) return;
    const { data } = await supabase
      .from("todos")
      .insert({ user_id: user.id, text: text.trim(), priority })
      .select()
      .single();
    if (data) setTodos(ts => [...ts, data]);
  };

  const toggle = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const { data } = await supabase
      .from("todos")
      .update({ done: !todo.done })
      .eq("id", id)
      .select()
      .single();
    if (data) setTodos(ts => ts.map(t => t.id === id ? data : t));
  };

  const remove = async (id) => {
    await supabase.from("todos").delete().eq("id", id);
    setTodos(ts => ts.filter(t => t.id !== id));
  };

  const doneCount  = todos.filter(t => t.done).length;
  const totalCount = todos.length;

  return { todos, loading, add, toggle, remove, doneCount, totalCount };
}
