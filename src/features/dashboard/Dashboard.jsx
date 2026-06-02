import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTodos }   from "../../hooks/useTodos";
import { useProfile } from "../../hooks/useProfile";
import {
  Flame, CheckCircle2, Circle, Plus, X,
  ChevronRight, Bell, Settings, BookOpen, Zap, Trophy,
} from "lucide-react";
import { useGoals } from "../../hooks/useGoals";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import { useFriends } from "../../hooks/useFriends";
import { useSessions } from "../../hooks/useSessions";
import { useTheme } from "../../store/ThemeContext";
import { useIsMobile } from "../../hooks/useIsMobile"; // ✅ Added import

/* ─── Static data ────────────────────────────────────────────────── */
const WEEK = ["M","T","W","T","F","S","S"];

/* ─── Helpers (no theme dependency) ───────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { colors: C } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile(); // ✅ Added hook call
  
  /* ── Real data hooks ── */
  const { todos, loading: todosLoading, add, toggle, remove } = useTodos();
  const { grouped, loading: goalsLoading } = useGoals();
  const dashboardGoals = [...(grouped?.longterm || []), ...(grouped?.shortterm || [])]
    .filter(g => !g.done).slice(0, 3);
  const { profile, displayName } = useProfile(); 
  /* ── Local UI state ── */
  const [newTodo,     setNewTodo]     = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const { myRank } = useLeaderboard();
  const { friends } = useFriends();  
  const { sessions, todayMinutes } = useSessions();
  const weekStudied = (() => {
    const today     = new Date();
    const dayOfWeek = today.getDay();
    const monday    = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const studiedDays = new Set(
      sessions.map(s => new Date(s.completed_at).toDateString())
    );
    return Array.from({ length:7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return studiedDays.has(d.toDateString());
    });
  })();

  /* ── Theme‑dependent helpers (moved inside) ────────────────────── */
  const card = (extra={}) => ({
    background: C.surface,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: "20px",
    ...extra,
  });

  const pill = (color, bg) => ({
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 4,
    background: bg,
    color,
  });

  const priorityStyle = (p) =>
    p === "high"   ? pill(C.red,    C.redDim)    :
    p === "medium" ? pill(C.accent, C.accentDim) :
                     pill(C.muted,  "rgba(107,114,128,0.15)");

  /* ── Handlers ── */
  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    add(text, newPriority);
    setNewTodo("");
    setNewPriority("medium");
  };

  /* First name only for greeting */
  const firstName  = displayName.split(" ")[0];
  const doneCount  = todos.filter(t => t.done).length;
  const totalCount = todos.length;
  const STAT_CARDS = [
    { label:"Study Streak",  value:`${profile?.streak ?? 0} days`, Icon:Flame,    bg:"rgba(245,158,11,0.1)", accent:C.accent },
    { label:"Today's Study", value: todayMinutes >= 60
      ? `${Math.floor(todayMinutes/60)}h ${todayMinutes%60}m`
      : `${todayMinutes}m`,
      Icon:BookOpen, bg:"rgba(59,130,246,0.1)", accent:C.blue },
    { label:"Tasks Done",    value:`${doneCount} / ${totalCount}`, Icon:Zap,      bg:"rgba(16,185,129,0.1)", accent:C.green  },
    { label:"Weekly Rank",   value: myRank ? `#${myRank}` : "—",  Icon:Trophy,   bg:"rgba(168,85,247,0.1)", accent:C.purple },
  ];

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100%",
      background:C.bg, color:C.text,
      fontFamily:'"Geist","SF Pro Display",-apple-system,sans-serif',
    }}>
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* ── Header ── */}
        <header style={{
          padding: isMobile ? "14px 16px" : "18px 28px", // ✅ Smaller padding on mobile
          borderBottom:`1px solid ${C.border}`,
          background:C.surface,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <div>
            <p style={{ margin:0, fontSize:12, color:C.muted }}>
              {new Date().toLocaleDateString("en-US",{
                weekday:"long", year:"numeric", month:"long", day:"numeric",
              })}
            </p>
            <h1 style={{ margin:"2px 0 0", fontSize: isMobile ? 18 : 22, fontWeight:800, letterSpacing:"-0.5px" }}>
              {greeting()}, <span style={{ color:C.accent }}>{firstName}</span> 👋
            </h1>
            {/* ✅ Hide grade on mobile */}
            {!isMobile && profile?.grade && (
              <p style={{ margin:"2px 0 0", fontSize:12, color:C.muted }}>
                {profile.grade} · {profile.subject}
              </p>
            )}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {[Bell, Settings].map((Icon,i) => (
              <button key={i} style={{
                padding: isMobile ? 6 : 8, // ✅ Smaller buttons on mobile
                borderRadius:8, background:"transparent",
                border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer",
                display:"flex", alignItems:"center",
              }}>
                <Icon size={16}/>
              </button>
            ))}
          </div>
        </header>

        {/* ── Scrollable body ── */}
        <div style={{ flex:1, overflowY:"auto", padding: isMobile ? "16px" : "24px 28px" }}>

          {/* ✅ Stat cards: 4 cols → 2 cols on mobile */}
          <div style={{ 
            display:"grid", 
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", 
            gap: isMobile ? 10 : 14, 
            marginBottom: isMobile ? 16 : 22 
          }}>
            {STAT_CARDS.map(({ label, value, Icon, bg, accent }) => (
              <div key={label} style={card({ padding: isMobile ? "12px" : "16px" })}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom: isMobile ? 8 : 12 }}>
                  <p style={{ margin:0, fontSize: isMobile ? 10 : 11, color:C.muted,
                    textTransform:"uppercase", letterSpacing:".6px" }}>{label}</p>
                  <div style={{ width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, 
                    borderRadius:7, background:bg,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon size={isMobile ? 13 : 15} color={accent}/>
                  </div>
                </div>
                <p style={{ margin:0, fontSize: isMobile ? 20 : 26, fontWeight:800,
                  color:accent, letterSpacing:"-1px" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* ✅ Two-column grid: side by side → stacked on mobile */}
          <div style={{ 
            display:"grid", 
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
            gap: isMobile ? 14 : 18, 
            marginBottom: isMobile ? 14 : 18 
          }}>

            {/* ── Todo list ── */}
            <div style={card({ padding: isMobile ? "14px" : "20px" })}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom: isMobile ? 10 : 14 }}>
                <h2 style={{ margin:0, fontSize: isMobile ? 14 : 15, fontWeight:700 }}>Today's Tasks</h2>
                <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px",
                  borderRadius:20, background:C.border, color:C.secondary }}>
                  {doneCount}/{totalCount}
                </span>
              </div>

              <div style={{ height:4, background:C.border, borderRadius:4,
                marginBottom: isMobile ? 10 : 14, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:4, background:C.accent,
                  width:`${totalCount ? (doneCount/totalCount)*100 : 0}%`,
                  transition:"width .4s ease",
                }}/>
              </div>

              <div style={{ maxHeight: isMobile ? 180 : 220, overflowY:"auto" }}>
                {todosLoading ? (
                  <p style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"20px 0" }}>
                    Loading tasks…
                  </p>
                ) : todos.length === 0 ? (
                  <p style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"20px 0" }}>
                    No tasks yet — add one below!
                  </p>
                ) : (
                  todos.map(todo => (
                    <div key={todo.id} style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"9px 0", borderBottom:`1px solid ${C.border}`,
                    }}>
                      <button onClick={()=>toggle(todo.id)} style={{
                        background:"none", border:"none", cursor:"pointer",
                        padding:0, flexShrink:0,
                        color:todo.done ? C.green : C.muted,
                        display:"flex", alignItems:"center",
                      }}>
                        {todo.done ? <CheckCircle2 size={17}/> : <Circle size={17}/>}
                      </button>
                      <span style={{
                        flex:1, fontSize:13,
                        color:todo.done ? C.muted : C.text,
                        textDecoration:todo.done ? "line-through" : "none",
                      }}>{todo.text}</span>
                      <span style={priorityStyle(todo.priority)}>{todo.priority}</span>
                      <button onClick={()=>remove(todo.id)} style={{
                        background:"none", border:"none", cursor:"pointer",
                        color:C.muted, padding:0, display:"flex", alignItems:"center",
                      }}>
                        <X size={13}/>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add task */}
              <div style={{ marginTop:12 }}>
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  {["low","medium","high"].map(p => (
                    <button key={p} onClick={()=>setNewPriority(p)} style={{
                      flex:1, padding:"5px", borderRadius:7, cursor:"pointer",
                      fontSize:11, fontWeight:600, textTransform:"capitalize",
                      transition:"all .15s",
                      background: newPriority===p
                        ? p==="high" ? C.redDim : p==="medium" ? C.accentDim : "rgba(107,114,128,0.15)"
                        : "transparent",
                      border:`1px solid ${newPriority===p
                        ? p==="high" ? C.red+"55" : p==="medium" ? C.accent+"55" : "#6B728055"
                        : C.border}`,
                      color: newPriority===p
                        ? p==="high" ? C.red : p==="medium" ? C.accent : C.muted
                        : C.muted,
                    }}>{p}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    value={newTodo}
                    onChange={e=>setNewTodo(e.target.value)}
                    onKeyDown={e=>e.key==="Enter" && addTodo()}
                    placeholder="Add a new task…"
                    style={{
                      flex:1, background:C.bg, border:`1px solid ${C.border}`,
                      borderRadius:8, padding:"8px 12px",
                      color:C.text, fontSize:13, outline:"none",
                    }}
                  />
                  <button onClick={addTodo} style={{
                    padding:"8px 12px", borderRadius:8,
                    background:C.accent, border:"none",
                    color:"#000", cursor:"pointer", fontWeight:700,
                    display:"flex", alignItems:"center",
                  }}>
                    <Plus size={16}/>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Goals ── */}
            <div style={card({ padding: isMobile ? "14px" : "20px" })}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom: isMobile ? 12 : 16 }}>
                <h2 style={{ margin:0, fontSize: isMobile ? 14 : 15, fontWeight:700 }}>Active Goals</h2>
                <button onClick={()=>navigate("/goals")} style={{
                  display:"flex", alignItems:"center", gap:3,
                  background:"none", border:"none", cursor:"pointer",
                  color:C.accent, fontSize:12, fontWeight:600,
                }}>
                  View all <ChevronRight size={12}/>
                </button>
              </div>

              {goalsLoading ? (
                <p style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"16px 0" }}>
                  Loading goals…
                </p>
              ) : dashboardGoals.length === 0 ? (
                <div style={{ textAlign:"center", padding:"16px 0" }}>
                  <p style={{ margin:"0 0 8px", fontSize:22 }}>🎯</p>
                  <p style={{ margin:"0 0 10px", fontSize:13, color:C.muted }}>
                    No active goals yet
                  </p>
                  <button onClick={()=>navigate("/goals")} style={{
                    padding:"7px 16px", borderRadius:8, cursor:"pointer",
                    background:C.accentDim, border:`1px solid ${C.accent}44`,
                    color:C.accent, fontSize:12, fontWeight:600,
                  }}>
                    Create a goal →
                  </button>
                </div>
              ) : (
                dashboardGoals.map(g => (
                  <div key={g.id} style={{ marginBottom: isMobile ? 14 : 18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:500 }}>{g.title}</p>
                      <p style={{ margin:0, fontSize:12, color:C.muted }}>
                        {g.progress}/{g.target} {g.unit}
                      </p>
                    </div>
                    <div style={{ height:6, background:C.border, borderRadius:6, overflow:"hidden" }}>
                      <div style={{
                        height:"100%", borderRadius:6, background:g.color,
                        width:`${Math.min(100, Math.round((g.progress/g.target)*100))}%`,
                        transition:"width .6s ease",
                      }}/>
                    </div>
                    <p style={{ margin:"4px 0 0", fontSize:11, color:C.muted, textAlign:"right" }}>
                      {Math.min(100, Math.round((g.progress/g.target)*100))}% complete
                    </p>
                  </div>
                ))
              )}

              {/* ── Weekly study grid ── */}
              <div style={{ display:"flex", gap: isMobile ? 3 : 5 }}>
                {["M","T","W","T","F","S","S"].map((day, i) => {
                  const studied = weekStudied[i];
                  const isFuture = i > new Date().getDay() - 1
                    && !(new Date().getDay() === 0 && i === 6);
                  return (
                    <div key={i} style={{ flex:1, textAlign:"center" }}>
                      <div style={{
                        width:"100%", aspectRatio:"1", borderRadius:5,
                        background: studied ? C.accent : isFuture ? C.border : "rgba(245,158,11,0.15)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize: isMobile ? 9 : 10, 
                        color: studied ? "#000" : C.muted,
                        marginBottom:4, fontWeight:700,
                        transition:"background .3s",
                      }}>
                        {studied ? "✓" : ""}
                      </div>
                      <span style={{ fontSize: isMobile ? 9 : 10, color:C.muted }}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ✅ Friends grid: 4 cols → 2 cols on mobile */}
          <div style={card({ padding: isMobile ? "14px" : "20px" })}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom: isMobile ? 10 : 14 }}>
              <h2 style={{ margin:0, fontSize: isMobile ? 14 : 15, fontWeight:700 }}>Friends Studying Now</h2>
              <button onClick={()=>navigate("/friends")} style={{
                display:"flex", alignItems:"center", gap:3,
                background:"none", border:"none", cursor:"pointer",
                color:C.accent, fontSize:12, fontWeight:600,
              }}>
                Find friends <ChevronRight size={12}/>
              </button>
            </div>

            {friends.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 0", color:C.muted }}>
                <p style={{ fontSize:24, margin:"0 0 8px" }}>👥</p>
                <p style={{ fontSize:13, margin:"0 0 12px" }}>No friends yet</p>
                <button onClick={()=>navigate("/friends")} style={{
                  padding:"7px 16px", borderRadius:8, cursor:"pointer",
                  background:C.accentDim, border:`1px solid ${C.accent}44`,
                  color:C.accent, fontSize:12, fontWeight:600,
                }}>Find study partners →</button>
              </div>
            ) : (
              <div style={{ 
                display:"grid",
                gridTemplateColumns: isMobile 
                  ? `repeat(${Math.min(friends.length, 2)},1fr)` // ✅ Max 2 cols on mobile
                  : `repeat(${Math.min(friends.length, 4)},1fr)`, 
                gap: isMobile ? 8 : 12 
              }}>
                {friends.slice(0, isMobile ? 2 : 4).map(f => { // ✅ Show fewer on mobile
                  const name    = f.full_name ?? "Friend";
                  const COLORS  = ["#EC4899",C.blue,C.green,C.purple,"#F97316","#14B8A6"];
                  const color   = COLORS[(name.charCodeAt(0)??0) % COLORS.length];
                  const initials= name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
                  return (
                    <div key={f.friendshipId} style={{
                      background:C.bg, borderRadius:10, 
                      padding: isMobile ? 10 : 14,
                      border:`1px solid ${C.border}`,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, 
                          borderRadius:8, flexShrink:0,
                          background:color, display:"flex", alignItems:"center",
                          justifyContent:"center", fontSize: isMobile ? 10 : 12, 
                          fontWeight:700, color:"#fff" }}>
                          {initials}
                        </div>
                        <div>
                          <p style={{ margin:0, fontSize: isMobile ? 12 : 13, fontWeight:600 }}>{name}</p>
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%", background:C.green }}/>
                            <span style={{ fontSize:10, color:C.muted }}>Friend</span>
                          </div>
                        </div>
                      </div>
                      <p style={{ margin:"0 0 4px", fontSize: isMobile ? 11 : 12, color:C.secondary }}>
                        {f.subject ?? f.grade ?? "Studying"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}