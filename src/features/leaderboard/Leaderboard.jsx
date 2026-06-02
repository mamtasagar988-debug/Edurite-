import { useState } from "react";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import {
  Flame, Clock, Trophy, TrendingUp, TrendingDown,
  Minus, Users, Globe, Target, Layers, Loader, Star,
} from "lucide-react";
import { useTheme } from "../../store/ThemeContext";
import { useIsMobile } from "../../hooks/useIsMobile"; // ✅ Added

/* ─── Constants (no theme dependency) ────────────────────────────── */
const GOLD   = "#F59E0B";
const SILVER = "#94A3B8";
const BRONZE = "#B87333";

const medal      = (r) => r===1 ? GOLD : r===2 ? SILVER : r===3 ? BRONZE : null;
const medalEmoji = (r) => r===1 ? "🥇" : r===2 ? "🥈" : r===3 ? "🥉" : null;

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ name="?", C, size=44, fontSize=14 }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const COLORS   = ["#EC4899", C.blue, C.green, C.purple, "#F97316", "#14B8A6", "#667eea", C.accent];
  const color    = COLORS[(name.charCodeAt(0)??0) % COLORS.length];
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.24, flexShrink:0,
      background:color, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize, fontWeight:800, color:"#fff", boxShadow:`0 2px 8px ${color}44` }}>
      {initials}
    </div>
  );
}

/* ─── Change chip ────────────────────────────────────────────────── */
function ChangeChip({ change=0, C }) {
  if (change===0) return (
    <span style={{ display:"flex", alignItems:"center", gap:2, fontSize:11, color:C.muted }}>
      <Minus size={10}/> —
    </span>
  );
  const up = change > 0;
  return (
    <span style={{ display:"flex", alignItems:"center", gap:2, fontSize:11,
      color:up?C.green:C.red, fontWeight:600 }}>
      {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
      {up?"+":""}{change}
    </span>
  );
}

/* ─── Podium ─────────────────────────────────────────────────────── */
function Podium({ users, C, isMobile }) {
  const order   = [users[1], users[0], users[2]];
  const heights = isMobile ? [60, 85, 45] : [80, 110, 60]; // ✅ Smaller on mobile
  const ranks   = [2, 1, 3];

  return (
    <div style={{ display:"flex", alignItems:"flex-end",
      justifyContent:"center", gap: isMobile ? 4 : 8, padding:"8px 0 0" }}>
      {order.map((u, i) => {
        const rank = ranks[i];
        const col  = medal(rank);
        if (!u) return <div key={i} style={{ width: isMobile ? 110 : 150 }}/>;
        return (
          <div key={u.id} style={{ display:"flex", flexDirection:"column",
            alignItems:"center", width: isMobile ? 110 : 150 }}>

            {/* Avatar */}
            <div style={{ position:"relative", marginBottom: isMobile ? 4 : 8 }}>
              <div style={{
                width: rank===1 ? (isMobile ? 56 : 72) : (isMobile ? 44 : 58),
                height: rank===1 ? (isMobile ? 56 : 72) : (isMobile ? 44 : 58),
                borderRadius: rank===1 ? (isMobile ? 14 : 18) : (isMobile ? 11 : 14),
                flexShrink:0,
              }}>
                <Avatar name={u.full_name ?? "?"} C={C} 
                  size={rank===1 ? (isMobile ? 56 : 72) : (isMobile ? 44 : 58)} 
                  fontSize={rank===1 ? (isMobile ? 17 : 22) : (isMobile ? 13 : 17)}/>
              </div>
              <div style={{ position:"absolute", inset:0, 
                borderRadius: rank===1 ? (isMobile ? 14 : 18) : (isMobile ? 11 : 14),
                boxShadow:`0 0 0 3px ${col}, 0 8px 32px ${col}66`,
                pointerEvents:"none" }}/>
              {rank===1 && (
                <div style={{ position:"absolute", top: isMobile ? -10 : -14, left:"50%",
                  transform:"translateX(-50%)", fontSize: isMobile ? 16 : 20 }}>👑</div>
              )}
            </div>

            {/* Name + XP */}
            <p style={{ margin:"0 0 2px", fontSize: rank===1 ? (isMobile ? 12 : 14) : (isMobile ? 11 : 13), 
              fontWeight:700,
              color:C.text, textAlign:"center", maxWidth: isMobile ? 100 : 130,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {u.full_name ?? "Unknown"}
            </p>
            <p style={{ margin:"0 0 8px", fontSize: isMobile ? 10 : 12, color:col, fontWeight:700 }}>
              {(u.total_xp??0).toLocaleString()} XP
            </p>

            {/* Podium block */}
            <div style={{ width:"100%", height:heights[i], borderRadius:"10px 10px 0 0",
              background:`linear-gradient(180deg,${col}22 0%,${col}10 100%)`,
              border:`1px solid ${col}44`, borderBottom:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexDirection:"column", gap:4 }}>
              <span style={{ fontSize: rank===1 ? (isMobile ? 22 : 28) : (isMobile ? 18 : 22) }}>
                {medalEmoji(rank)}
              </span>
              <span style={{ fontSize: isMobile ? 10 : 11, color:col, fontWeight:700 }}>#{rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Rank row ───────────────────────────────────────────────────── */
function RankRow({ user, rank, maxXp, C, isMobile }) {
  const col  = medal(rank);
  const isMe = user.isMe;
  return (
    <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 8 : 12,
      padding: isMobile ? "10px 12px" : "12px 16px",
      background: isMe ? "rgba(245,158,11,0.06)" : "transparent",
      borderBottom:`1px solid ${C.border}`,
      borderLeft: isMe ? `3px solid ${C.accent}` : "3px solid transparent" }}>

      {/* Rank */}
      <div style={{ width: isMobile ? 22 : 28, textAlign:"center", flexShrink:0 }}>
        {col
          ? <span style={{ fontSize: isMobile ? 15 : 18 }}>{medalEmoji(rank)}</span>
          : <span style={{ fontSize: isMobile ? 12 : 14, fontWeight:700, color:C.muted }}>{rank}</span>}
      </div>

      <Avatar name={user.full_name ?? "?"} C={C} size={isMobile ? 32 : 38} fontSize={isMobile ? 11 : 13}/>

      {/* Name + grade */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <p style={{ margin:0, fontSize: isMobile ? 12 : 14, fontWeight:700,
            color: isMe ? C.accent : C.text,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {user.full_name ?? "Unknown"}
          </p>
          {isMe && (
            <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4,
              background:C.accentDim, color:C.accent, fontWeight:700, flexShrink:0 }}>
              YOU
            </span>
          )}
        </div>
        {!isMobile && ( // ✅ Hide grade on mobile in rows
          <p style={{ margin:0, fontSize:11, color:C.muted }}>
            {user.grade ?? ""}
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 10 : 18, flexShrink:0 }}>
        {!isMobile && ( // ✅ Hide hours column on mobile
          <div style={{ textAlign:"right", minWidth:50 }}>
            <p style={{ margin:0, fontSize:12, color:C.muted }}>
              {Number(user.study_hours??0).toFixed(1)}h
            </p>
          </div>
        )}
        <div style={{ textAlign:"right", minWidth: isMobile ? 35 : 48 }}>
          <p style={{ margin:0, fontSize: isMobile ? 11 : 12, color:C.accent }}>
            🔥 {user.streak??0}d
          </p>
        </div>

        {/* XP bar */}
        <div style={{ width: isMobile ? 60 : 90 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize: isMobile ? 11 : 12, fontWeight:700,
              color: col ?? (isMe ? C.accent : C.text) }}>
              {(user.total_xp??0).toLocaleString()}
            </span>
            <span style={{ fontSize:10, color:C.muted }}>XP</span>
          </div>
          <div style={{ height:4, background:C.border, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:4,
              background: col ?? (isMe ? C.accent : C.secondary),
              width:`${maxXp > 0 ? ((user.total_xp??0)/maxXp)*100 : 0}%`,
              transition:"width .6s ease" }}/>
          </div>
        </div>

        {!isMobile && ( // ✅ Hide change column on mobile
          <div style={{ width:28, textAlign:"center" }}>
            <ChangeChip change={0} C={C}/>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function Leaderboard() {
  const { colors: C } = useTheme();
  const isMobile = useIsMobile(); // ✅ Added
  const { rankings, loading, myRank, maxXp, myBreakdown } = useLeaderboard();
  const [period, setPeriod] = useState("week");

  // Define theme-dependent helpers inside component
  const card = (extra={}) => ({
    background: C.surface,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    ...extra,
  });

  // Define BADGES with access to C
  const BADGES = [
    { emoji:"🔥", name:"Streak Master",  desc:"7+ day streak",         earned:(u)=> u?.streak >= 7  },
    { emoji:"📚", name:"Bookworm",        desc:"50+ XP from sessions",  earned:(u)=> (u?.total_xp??0) >= 50  },
    { emoji:"🏆", name:"Top 10",          desc:"Reach global top 10",   earned:(u)=> (u?.rank??99) <= 10 },
    { emoji:"🎯", name:"Goal Getter",     desc:"Goals completed",       earned:()=> false },
    { emoji:"⭐", name:"Star Student",    desc:"Reach top 3",           earned:(u)=> (u?.rank??99) <= 3  },
    { emoji:"⚡", name:"Speed Demon",     desc:"5 sessions in one day", earned:()=> false },
  ];

  const top3   = rankings.slice(0, 3);
  const rest   = rankings.slice(3);
  const me     = rankings.find(r => r.isMe);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:'"Geist","SF Pro Display",-apple-system,sans-serif',
      display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <header style={{ 
        padding: isMobile ? "14px 16px" : "18px 28px", // ✅ Mobile padding
        borderBottom:`1px solid ${C.border}`,
        background:C.surface,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexShrink:0 
      }}>
        <div>
          <p style={{ margin:0, fontSize:11, color:C.muted,
            textTransform:"uppercase", letterSpacing:".8px" }}>Leaderboard</p>
          <h1 style={{ margin:"2px 0 0", fontSize: isMobile ? 18 : 20, fontWeight:800, letterSpacing:"-0.4px" }}>
            Top Studiers 🏆
          </h1>
        </div>
        {/* Period filter */}
        <div style={{ display:"flex", gap:4, background:C.bg, borderRadius:9,
          padding:3, border:`1px solid ${C.border}` }}>
          {[
            { key:"week",  label:"This Week"  },
            { key:"month", label:"This Month" },
            { key:"all",   label:"All Time"   },
          ].map(p => (
            <button key={p.key} onClick={()=>setPeriod(p.key)} style={{
              padding: isMobile ? "5px 10px" : "6px 14px", // ✅ Smaller buttons
              borderRadius:7, cursor:"pointer",
              background: period===p.key ? C.surface : "transparent",
              border: period===p.key ? `1px solid ${C.border}` : "1px solid transparent",
              color: period===p.key ? C.text : C.muted,
              fontSize: isMobile ? 11 : 12, fontWeight: period===p.key?600:400,
              transition:"all .15s" }}>{p.label}</button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div style={{ 
        flex:1, 
        display:"grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", // ✅ Stack on mobile
        overflow:"hidden" 
      }}>

        {/* LEFT — rankings */}
        <div style={{ overflowY:"auto", 
          borderRight: isMobile ? "none" : `1px solid ${C.border}` // ✅ No border on mobile
        }}>

          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", padding:"80px 0", gap:16, color:C.muted }}>
              <Loader size={22} style={{ animation:"spin 1s linear infinite" }}/>
              <p style={{ margin:0, fontSize:13 }}>Loading rankings…</p>
            </div>
          ) : rankings.length === 0 ? (
            <div style={{ textAlign:"center", padding: isMobile ? "60px 20px" : "80px 28px", color:C.muted }}>
              <p style={{ fontSize:36, margin:"0 0 12px" }}>🏆</p>
              <p style={{ fontSize:16, fontWeight:700, color:C.secondary, margin:"0 0 6px" }}>
                No rankings yet
              </p>
              <p style={{ fontSize:13 }}>
                Complete Pomodoro sessions and goals to earn XP and appear here!
              </p>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div style={{ 
                padding: isMobile ? "16px 12px 0" : "28px 28px 0", // ✅ Less padding on mobile
                background:`radial-gradient(ellipse at 50% 0%,${GOLD}08 0%,${C.bg} 65%)` 
              }}>
                <Podium users={top3} C={C} isMobile={isMobile}/>
              </div>

              {/* Separator */}
              <div style={{ display:"flex", alignItems:"center", gap:12,
                padding: isMobile ? "14px 16px 0" : "18px 20px 0" }}>
                <div style={{ flex:1, height:1, background:C.border }}/>
                <span style={{ fontSize:11, color:C.muted, fontWeight:600,
                  textTransform:"uppercase", letterSpacing:".6px" }}>Rankings</span>
                <div style={{ flex:1, height:1, background:C.border }}/>
              </div>

              {/* Column headers - hide on mobile */}
              {!isMobile && (
                <div style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"10px 16px", fontSize:11, color:C.muted, fontWeight:600,
                  textTransform:"uppercase", letterSpacing:".5px" }}>
                  <div style={{ width:28 }}>#</div>
                  <div style={{ width:38 }}/>
                  <div style={{ flex:1 }}>Student</div>
                  <div style={{ display:"flex", gap:18, flexShrink:0, paddingRight:28 }}>
                    <span style={{ minWidth:50, textAlign:"right" }}>Hours</span>
                    <span style={{ minWidth:48, textAlign:"right" }}>Streak</span>
                    <span style={{ width:90 }}>XP</span>
                    <span style={{ width:28 }}>±</span>
                  </div>
                </div>
              )}

              {/* Rows 4+ */}
              {rest.map((u, i) => (
                <RankRow key={u.id} user={u} rank={i+4} maxXp={maxXp} C={C} isMobile={isMobile}/>
              ))}

              {/* Pinned own row if not visible */}
              {me && (me.rank??99) > rest.length+3 && (
                <div style={{ position:"sticky", bottom:0, background:C.surface,
                  borderTop:`1px solid ${C.accent}44` }}>
                  <RankRow user={me} rank={me.rank} maxXp={maxXp} C={C} isMobile={isMobile}/>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT — sidebar: hidden on mobile */}
        {!isMobile && (
          <div style={{ overflowY:"auto", padding:20, display:"flex",
            flexDirection:"column", gap:16 }}>

            {/* Your rank card */}
            <div style={{ ...card({ padding:"18px" }),
              background:`radial-gradient(ellipse at 0% 0%,${C.accent}10 0%,${C.surface} 60%)`,
              border:`1px solid ${C.accent}33` }}>
              <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:700,
                textTransform:"uppercase", letterSpacing:".7px", color:C.muted }}>
                Your Standing
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <Avatar name={me?.full_name ?? "You"} C={C} size={48} fontSize={16}/>
                <div>
                  <p style={{ margin:0, fontSize:15, fontWeight:800 }}>
                    {me?.full_name ?? "You"}
                  </p>
                  <p style={{ margin:0, fontSize:12, color:C.muted }}>
                    {me?.grade ?? ""}
                  </p>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:"Global Rank", value: myRank ? `#${myRank}` : "—",                       color:C.accent },
                  { label:"Total XP",    value: (me?.total_xp??0).toLocaleString(),                 color:C.green  },
                  { label:"Study Hours", value: `${Number(me?.study_hours??0).toFixed(1)}h`,        color:C.blue   },
                  { label:"Streak",      value: `${me?.streak??0}d 🔥`,                             color:C.accent },
                ].map(s => (
                  <div key={s.label} style={{ background:C.bg, borderRadius:8, padding:"10px",
                    border:`1px solid ${C.border}` }}>
                    <p style={{ margin:"0 0 2px", fontSize:16, fontWeight:800,
                      color:s.color }}>{s.value}</p>
                    <p style={{ margin:0, fontSize:11, color:C.muted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* XP Breakdown */}
            <div style={card({ padding:"18px" })}>
              <p style={{ margin:"0 0 14px", fontSize:11, fontWeight:700,
                textTransform:"uppercase", letterSpacing:".7px", color:C.muted }}>
                XP Breakdown
              </p>
              {myBreakdown ? (
                <>
                  {[
                    { source:"Study Sessions",  xp:myBreakdown.sessionXp, Icon:Clock,  color:C.blue   },
                    { source:"Streak Bonus",     xp:myBreakdown.streakXp,  Icon:Flame,  color:C.accent },
                    { source:"Goals Completed",  xp:myBreakdown.goalXp,    Icon:Target, color:C.purple },
                  ].map(src => {
                    const total = (myBreakdown.sessionXp + myBreakdown.streakXp + myBreakdown.goalXp) || 1;
                    return (
                      <div key={src.source} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <src.Icon size={12} color={src.color}/>
                            <span style={{ fontSize:12, color:C.secondary }}>{src.source}</span>
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color:src.color }}>
                            {src.xp} XP
                          </span>
                        </div>
                        <div style={{ height:4, background:C.border, borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:4, background:src.color,
                            width:`${Math.round((src.xp/total)*100)}%`,
                            transition:"width .6s ease" }}/>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display:"flex", justifyContent:"space-between",
                    paddingTop:10, borderTop:`1px solid ${C.border}`, marginTop:4 }}>
                    <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>Total</span>
                    <span style={{ fontSize:13, fontWeight:800, color:C.text }}>
                      {(me?.total_xp??0).toLocaleString()} XP
                    </span>
                  </div>
                </>
              ) : (
                <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"12px 0" }}>
                  Complete sessions and goals to earn XP!
                </p>
              )}
            </div>

            {/* Achievements */}
            <div style={card({ padding:"18px" })}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:14 }}>
                <p style={{ margin:0, fontSize:11, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:".7px", color:C.muted }}>
                  Achievements
                </p>
                <span style={{ fontSize:11, color:C.muted }}>
                  {BADGES.filter(b=>b.earned(me)).length}/{BADGES.length}
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {BADGES.map(b => {
                  const earned = b.earned(me);
                  return (
                    <div key={b.name} style={{ background: earned ? C.accentDim : C.bg,
                      border:`1px solid ${earned ? C.accent+"44" : C.border}`,
                      borderRadius:8, padding:"10px",
                      opacity: earned ? 1 : 0.45, position:"relative" }}>
                      <p style={{ margin:"0 0 3px", fontSize:22 }}>{b.emoji}</p>
                      <p style={{ margin:"0 0 1px", fontSize:11, fontWeight:700,
                        color: earned ? C.text : C.muted }}>{b.name}</p>
                      <p style={{ margin:0, fontSize:10, color:C.muted, lineHeight:1.3 }}>
                        {b.desc}
                      </p>
                      {earned && (
                        <div style={{ position:"absolute", top:6, right:6, width:14, height:14,
                          borderRadius:"50%", background:C.green,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:8, color:"#000", fontWeight:900 }}>✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How XP works */}
            <div style={card({ padding:"16px" })}>
              <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:700,
                textTransform:"uppercase", letterSpacing:".7px", color:C.muted }}>
                How XP is Earned
              </p>
              {[
                { action:"Pomodoro session",   xp:"+50 XP",  emoji:"🍅" },
                { action:"Daily streak",        xp:"+10 XP",  emoji:"🔥" },
                { action:"Goal completed",      xp:"+100 XP", emoji:"🎯" },
              ].map(r => (
                <div key={r.action} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"7px 0",
                  borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.secondary }}>
                    {r.emoji} {r.action}
                  </span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.green }}>{r.xp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}