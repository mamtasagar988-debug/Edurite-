import { useState } from "react";
import {
  Plus, X, Star, Target, Calendar, Check,
  Edit2, Trash2, Zap, Flame, Layers,
  BookOpen, Timer, ArrowUp,
} from "lucide-react";
import { useGoals } from "../../hooks/useGoals";
import { useTheme } from "../../store/ThemeContext";
import { useIsMobile } from "../../hooks/useIsMobile"; // ✅ Added

/* ─── Constants (no theme dependency) ────────────────────────────── */
const PERIODS    = ["Daily","Weekly","Monthly","Yearly"];
const BIG_EMOJIS = ["🚀","🏆","💡","🔬","⚕️","⚖️","🎨","🎵","💻","🌍","✈️","🏛️","🧬","📐","🔭","💰"];

/* ─── Helpers ────────────────────────────────────────────────────── */
function daysLeft(deadline) {
  const d = Math.ceil((new Date(deadline)-new Date())/86400000);
  if (d<0)    return { label:"Overdue",    color:"#EF4444" };
  if (d===0)  return { label:"Due today",  color:"#F97316" };
  if (d<=3)   return { label:`${d}d left`, color:"#F97316" };
  return            { label:`${d}d left`,  color:"#6B7280" };
}

function pct(g) {
  return Math.min(100, Math.round((g.progress/g.target)*100));
}

/* ─── Ring ───────────────────────────────────────────────────────── */
function Ring({ pct, color, borderColor, size=58, stroke=5 }) {
  const r=  (size-stroke*2)/2, circ=2*Math.PI*r, cx=size/2;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={borderColor}  strokeWidth={stroke}/>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
        style={{ transition:"stroke-dashoffset .6s ease" }}/>
    </svg>
  );
}

/* ─── Overlay ────────────────────────────────────────────────────── */
function Overlay({ children, onClose, C, wide=false }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderRadius:16,
        border:`1px solid ${C.border}`, padding:28,
        width:"100%", maxWidth:wide?540:420, maxHeight:"90vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Log modal ──────────────────────────────────────────────────── */
function LogModal({ goal, C, onSave, onClose }) {
  const [amt, setAmt] = useState(1);
  return (
    <Overlay onClose={onClose} C={C}>
      <h2 style={{ margin:"0 0 6px", fontSize:17, fontWeight:800 }}>Log Progress</h2>
      <p style={{ margin:"0 0 20px", fontSize:13, color:C.muted }}>{goal.title}</p>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <button onClick={()=>setAmt(a=>Math.max(1,a-1))} style={{ width:36, height:36, borderRadius:8,
          background:C.bg, border:`1px solid ${C.border}`, color:C.text, fontSize:20,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
        <input type="number" min={1} value={amt} onChange={e=>setAmt(Math.max(1,Number(e.target.value)))}
          style={{ flex:1, textAlign:"center", background:C.bg, border:`1px solid ${C.border}`,
            borderRadius:8, padding:8, color:C.text, fontSize:20, fontWeight:700, outline:"none" }}/>
        <button onClick={()=>setAmt(a=>a+1)} style={{ width:36, height:36, borderRadius:8,
          background:C.bg, border:`1px solid ${C.border}`, color:C.text, fontSize:20,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
      </div>
      <p style={{ margin:"0 0 18px", fontSize:12, color:C.muted }}>
        {goal.progress} → {Math.min(goal.target, goal.progress+amt)} / {goal.target} {goal.unit}
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:11, borderRadius:10, cursor:"pointer",
          background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontWeight:600 }}>Cancel</button>
        <button onClick={()=>onSave(amt)} style={{ flex:2, padding:11, borderRadius:10,
          cursor:"pointer", background:goal.color, border:"none", color:"#000", fontWeight:800 }}>Save</button>
      </div>
    </Overlay>
  );
}

/* ─── Goal modal (create/edit) ───────────────────────────────────── */
function GoalModal({ initial, C, onSave, onClose }) {
  const GOAL_TYPES = [
    { key:"big",       label:"Big Goal",   desc:"Ultimate life aspiration", color:C.accent, dim:C.accentDim, Icon:Star    },
    { key:"longterm",  label:"Long Term",  desc:"Months to years",          color:C.purple, dim:C.purpleDim, Icon:ArrowUp },
    { key:"shortterm", label:"Short Term", desc:"Days to weeks",            color:C.blue,   dim:C.blueDim,   Icon:Zap     },
  ];

  const METRICS = [
    { key:"study",     label:"Study Hours", Icon:BookOpen, color:C.blue   },
    { key:"flashcard", label:"Flashcards",  Icon:Layers,   color:C.green  },
    { key:"streak",    label:"Streak",      Icon:Flame,    color:C.accent },
    { key:"pomodoro",  label:"Pomodoro",    Icon:Timer,    color:C.orange },
    { key:"custom",    label:"Custom",      Icon:Target,   color:C.purple },
  ];

  const PALETTE = [C.accent, C.blue, C.green, C.purple, C.orange, C.red, "#EC4899", "#14B8A6"];
  
  const isEdit   = !!initial?.title;
  const initType = initial?.type ?? "shortterm";
  const [type,      setType]      = useState(initType);
  const [title,     setTitle]     = useState(initial?.title       ?? "");
  const [desc,      setDesc]      = useState(initial?.description ?? "");
  const [emoji,     setEmoji]     = useState(initial?.emoji       ?? "🚀");
  const [color,     setColor]     = useState(initial?.color       ?? C.blue);
  const [metric,    setMetric]    = useState(initial?.metric      ?? "study");
  const [unit,      setUnit]      = useState(initial?.unit        ?? "hrs");
  const [target,    setTarget]    = useState(initial?.target      ?? 10);
  const [period,    setPeriod]    = useState(initial?.period      ?? "Monthly");
  const [deadline,  setDeadline]  = useState(initial?.deadline    ?? "2026-12-31");
  const [showEmoji, setShowEmoji] = useState(false);

  const isBig = type==="big";

  const handleSave = () => {
    if (!title.trim()) return;
    const baseData = isBig
      ? { type:"big", title:title.trim(), description:desc.trim(), emoji, color }
      : { type, title:title.trim(), metric, unit,
          target:Number(target), progress:initial?.progress??0,
          period, deadline, color, done:initial?.done??false };
    
    onSave(initial?.id ? { id: initial.id, ...baseData } : baseData);
  };

  return (
    <Overlay onClose={onClose} C={C} wide>
      <h2 style={{ margin:"0 0 18px", fontSize:17, fontWeight:800 }}>
        {isEdit ? "Edit Goal" : "Create New Goal"}
      </h2>

      {/* Type */}
      <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Goal Type</p>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {GOAL_TYPES.map(t => (
          <button key={t.key} onClick={()=>{ setType(t.key); setColor(t.color); }} style={{
            flex:1, padding:"10px 6px", borderRadius:10, cursor:"pointer",
            background: type===t.key ? t.dim : "transparent",
            border:`1px solid ${type===t.key ? t.color+"55" : C.border}`,
            color: type===t.key ? t.color : C.muted,
            display:"flex", flexDirection:"column", alignItems:"center", gap:5, transition:"all .15s" }}>
            <t.Icon size={16}/>
            <span style={{ fontSize:12, fontWeight:700 }}>{t.label}</span>
            <span style={{ fontSize:10, color:C.muted, textAlign:"center" }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Big goal fields */}
      {isBig && (
        <>
          <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Icon</p>
          <div style={{ position:"relative", marginBottom:16 }}>
            <button onClick={()=>setShowEmoji(s=>!s)} style={{ fontSize:28, background:C.bg,
              border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px", cursor:"pointer" }}>
              {emoji}
            </button>
            {showEmoji && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:50,
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
                padding:10, display:"flex", flexWrap:"wrap", gap:4, width:280,
                boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                {BIG_EMOJIS.map(e => (
                  <button key={e} onClick={()=>{ setEmoji(e); setShowEmoji(false); }}
                    style={{ fontSize:22, background:"none", border:"none",
                      cursor:"pointer", borderRadius:6, padding:"4px 5px" }}>{e}</button>
                ))}
              </div>
            )}
          </div>
          <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Aspiration *</p>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="e.g. Become a Nuclear Scientist, Doctor, IAS Officer…"
            style={{ width:"100%", boxSizing:"border-box", marginBottom:14,
              background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"10px 12px", color:C.text, fontSize:15, fontWeight:700, outline:"none" }}/>
          <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>
            Description <span style={{ color:C.muted, fontWeight:400 }}>(optional)</span>
          </p>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
            placeholder="Why this matters to you, how you'll get there…"
            style={{ width:"100%", boxSizing:"border-box", resize:"vertical", marginBottom:16,
              background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"10px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:"inherit" }}/>
        </>
      )}

      {/* Working goal fields */}
      {!isBig && (
        <>
          <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Title *</p>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="e.g. Study 30 hours this month…"
            style={{ width:"100%", boxSizing:"border-box", marginBottom:16,
              background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
              padding:"10px 12px", color:C.text, fontSize:14, outline:"none" }}/>
          <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Metric</p>
          <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            {METRICS.map(m => (
              <button key={m.key} onClick={()=>setMetric(m.key)} style={{
                display:"flex", alignItems:"center", gap:5, padding:"6px 12px",
                borderRadius:8, cursor:"pointer",
                background: metric===m.key ? `${m.color}18` : "transparent",
                border:`1px solid ${metric===m.key ? m.color+"55" : C.border}`,
                color: metric===m.key ? m.color : C.muted, fontSize:12, fontWeight:600 }}>
                <m.Icon size={12}/>{m.label}
              </button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            <div>
              <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:600 }}>Target</p>
              <input type="number" min={1} value={target} onChange={e=>setTarget(e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", background:C.bg,
                  border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px",
                  color:C.text, fontSize:14, outline:"none" }}/>
            </div>
            <div>
              <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:600 }}>Unit</p>
              <input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="hrs, cards…"
                style={{ width:"100%", boxSizing:"border-box", background:C.bg,
                  border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px",
                  color:C.text, fontSize:14, outline:"none" }}/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            <div>
              <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Period</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {PERIODS.map(p => (
                  <button key={p} onClick={()=>setPeriod(p)} style={{ padding:"6px 11px",
                    borderRadius:7, cursor:"pointer", fontSize:12,
                    background: period===p ? C.accentDim : "transparent",
                    border:`1px solid ${period===p ? C.accent+"55" : C.border}`,
                    color: period===p ? C.accent : C.muted, fontWeight:600 }}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:600 }}>Deadline</p>
              <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}
                style={{ width:"100%", boxSizing:"border-box", background:C.bg,
                  border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px",
                  color:C.text, fontSize:13, outline:"none", colorScheme:"dark" }}/>
            </div>
          </div>
        </>
      )}

      {/* Color */}
      <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Color</p>
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {PALETTE.map(col => (
          <button key={col} onClick={()=>setColor(col)} style={{ width:26, height:26,
            borderRadius:"50%", background:col, cursor:"pointer", border:"none",
            outline: color===col ? `3px solid ${C.text}` : "3px solid transparent",
            outlineOffset:2, transition:"outline .15s" }}/>
        ))}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:11, borderRadius:10, cursor:"pointer",
          background:"transparent", border:`1px solid ${C.border}`,
          color:C.muted, fontWeight:600, fontSize:13 }}>Cancel</button>
        <button onClick={handleSave} disabled={!title.trim()} style={{ flex:2, padding:11,
          borderRadius:10, cursor:title.trim()?"pointer":"not-allowed",
          background:title.trim()?color:C.border, border:"none",
          color:"#000", fontWeight:800, fontSize:13, opacity:title.trim()?1:0.5 }}>
          {isEdit ? "Save Changes" : "Create Goal"}
        </button>
      </div>
    </Overlay>
  );
}

/* ─── Working goal card ──────────────────────────────────────────── */
function GoalCard({ goal, typeConf, C, onEdit, onDelete, onLog, onToggleDone }) {
  const METRICS = [
    { key:"study",     label:"Study Hours", Icon:BookOpen, color:C.blue   },
    { key:"flashcard", label:"Flashcards",  Icon:Layers,   color:C.green  },
    { key:"streak",    label:"Streak",      Icon:Flame,    color:C.accent },
    { key:"pomodoro",  label:"Pomodoro",    Icon:Timer,    color:C.orange },
    { key:"custom",    label:"Custom",      Icon:Target,   color:C.purple },
  ];

  const p   = pct(goal);
  const dl  = daysLeft(goal.deadline);
  const met = METRICS.find(m=>m.key===goal.metric)??METRICS[4];
  
  return (
    <div style={{ 
      background:C.surface, borderRadius:12, 
      border:`1px solid ${C.border}`, 
      borderLeft:`3px solid ${goal.color}`,
      padding:"18px",
      opacity:goal.done?0.7:1 
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
        <div style={{ position:"relative", width:56, height:56, flexShrink:0 }}>
          <Ring pct={goal.done?100:p} color={goal.done?C.green:goal.color} borderColor={C.border}/>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:12, fontWeight:800,
            color:goal.done?C.green:goal.color }}>
            {goal.done?<Check size={17}/>:`${p}%`}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
            <met.Icon size={11} color={goal.color}/>
            <span style={{ fontSize:10, color:goal.color, fontWeight:600,
              textTransform:"uppercase", letterSpacing:".4px" }}>{met.label}</span>
            <span style={{ fontSize:10, padding:"1px 6px", borderRadius:5,
              background:`${typeConf.color}15`, color:typeConf.color, fontWeight:600 }}>
              {typeConf.label}
            </span>
          </div>
          <p style={{ margin:"0 0 5px", fontSize:14, fontWeight:700, color:C.text,
            textDecoration:goal.done?"line-through":"none" }}>{goal.title}</p>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, padding:"2px 7px", borderRadius:5,
              background:`${goal.color}12`, color:goal.color, fontWeight:600 }}>{goal.period}</span>
            <span style={{ fontSize:11, color:dl.color, display:"flex", alignItems:"center", gap:3 }}>
              <Calendar size={10}/> {dl.label}
            </span>
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={()=>onEdit(goal)} style={{ padding:5, borderRadius:7, cursor:"pointer",
            background:"transparent", border:`1px solid ${C.border}`, color:C.muted, display:"flex" }}>
            <Edit2 size={12}/></button>
          <button onClick={()=>onDelete(goal.type, goal.id)} style={{ padding:5, borderRadius:7,
            cursor:"pointer", background:"transparent", border:`1px solid ${C.border}`,
            color:C.muted, display:"flex" }}><Trash2 size={12}/></button>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:12, color:C.muted }}>Progress</span>
          <span style={{ fontSize:12, fontWeight:700, color:goal.done?C.green:goal.color }}>
            {goal.progress} / {goal.target} {goal.unit}
          </span>
        </div>
        <div style={{ height:5, background:C.border, borderRadius:5, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:5, background:goal.done?C.green:goal.color,
            width:`${goal.done?100:p}%`, transition:"width .5s ease" }}/>
        </div>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        {!goal.done && (
          <button onClick={()=>onLog(goal)} style={{ flex:1, padding:"7px", borderRadius:8,
            cursor:"pointer", background:`${goal.color}14`, border:`1px solid ${goal.color}33`,
            color:goal.color, fontSize:12, fontWeight:600,
            display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
            <Plus size={12}/> Log Progress
          </button>
        )}
        <button onClick={()=>onToggleDone(goal.type, goal.id)} style={{ padding:"7px 12px",
          borderRadius:8, cursor:"pointer",
          background:goal.done?C.greenDim:"transparent",
          border:`1px solid ${goal.done?C.green+"44":C.border}`,
          color:goal.done?C.green:C.muted, fontSize:12, fontWeight:600,
          display:"flex", alignItems:"center", gap:4 }}>
          {goal.done?<><Check size={12}/> Done</>:<><Target size={12}/> Mark done</>}
        </button>
      </div>
    </div>
  );
}

/* ─── Section wrapper ────────────────────────────────────────────── */
function Section({ typeConf, goals, filter, C, isMobile, onAdd, onEdit, onDelete, onLog, onToggle }) {
  const shown = goals.filter(g =>
    filter==="all" ? true : filter==="active" ? !g.done : g.done
  );
  return (
    <section style={{ marginBottom:30 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <typeConf.Icon size={15} color={typeConf.color}/>
          <h2 style={{ margin:0, fontSize:13, fontWeight:800, textTransform:"uppercase",
            letterSpacing:"1px", color:typeConf.color }}>{typeConf.label}</h2>
          <span style={{ fontSize:11, padding:"1px 8px", borderRadius:20,
            background:typeConf.dim, color:typeConf.color, fontWeight:600 }}>
            {goals.length}
          </span>
        </div>
        <button onClick={onAdd} style={{ display:"flex", alignItems:"center", gap:5,
          padding:"5px 12px", borderRadius:7, cursor:"pointer",
          background:typeConf.dim, border:`1px solid ${typeConf.color}44`,
          color:typeConf.color, fontSize:12, fontWeight:600 }}>
          <Plus size={12}/> Add
        </button>
      </div>
      {shown.length===0 ? (
        <div style={{ 
          background:C.surface, borderRadius:12, 
          border:`1px dashed ${C.border}`, 
          padding:"22px",
          textAlign:"center", color:C.muted 
        }}>
          <p style={{ margin:"0 0 4px", fontSize:20 }}>{typeConf.key==="longterm"?"📅":"⚡"}</p>
          <p style={{ margin:0, fontSize:13 }}>No {typeConf.label.toLowerCase()} goals yet</p>
        </div>
      ) : (
        <div style={{ 
          display:"grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(310px,1fr))", // ✅ Mobile responsive
          gap:14 
        }}>
          {shown.map(g => (
            <GoalCard key={g.id} goal={g} typeConf={typeConf} C={C}
              onEdit={onEdit} onDelete={onDelete} onLog={onLog} onToggleDone={onToggle}/>
          ))}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function Goals() {
  const { colors: C } = useTheme();
  const isMobile = useIsMobile(); // ✅ Added
  const { grouped, loading: goalsLoading, add, update, remove, logProgress: logProg } = useGoals();
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal,   setEditGoal]   = useState(null);
  const [logGoal,    setLogGoal]    = useState(null);
  const [filter,     setFilter]     = useState("all");
  const [initType,   setInitType]   = useState("shortterm");

  // Define theme-dependent constants here
  const GOAL_TYPES = [
    { key:"big",       label:"Big Goal",   desc:"Ultimate life aspiration", color:C.accent, dim:C.accentDim, Icon:Star    },
    { key:"longterm",  label:"Long Term",  desc:"Months to years",          color:C.purple, dim:C.purpleDim, Icon:ArrowUp },
    { key:"shortterm", label:"Short Term", desc:"Days to weeks",            color:C.blue,   dim:C.blueDim,   Icon:Zap     },
  ];

  const allWorking  = [...(grouped.longterm || []), ...(grouped.shortterm || [])];
  const activeCount = allWorking.filter(g=>!g.done).length;
  const doneCount   = allWorking.filter(g=>g.done).length;
  const avgPct      = activeCount
    ? Math.round(allWorking.filter(g=>!g.done).reduce((a,g)=>a+pct(g),0)/activeCount) : 0;

  const saveGoal = async (g) => {
    const { id, createdAt, ...goalData } = g;

    if (editGoal && editGoal.id && typeof editGoal.id === "string") {
      await update(editGoal.id, goalData);
    } else {
      await add(goalData);
    }
    setShowCreate(false);
    setEditGoal(null);
  };

  const deleteGoal = async (type, id) => {
    await remove(id);
  };

  const toggleDone = async (type, id) => {
    const all = [...(grouped.big || []), ...(grouped.longterm || []), ...(grouped.shortterm || [])];
    const goal = all.find(g => g.id === id);
    if (goal) await update(id, { done: !goal.done });
  };

  const logProgressHandler = async (id, type, amt) => {
    await logProg(id, amt);
    setLogGoal(null);
  };

  const openCreate = (type) => { setInitType(type); setShowCreate(true); };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:'"Geist","SF Pro Display",-apple-system,sans-serif',
      display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <header style={{ 
        padding: isMobile ? "14px 16px" : "18px 28px", // ✅ Mobile padding
        borderBottom:`1px solid ${C.border}`,
        background:C.surface, display:"flex", alignItems:"center",
        justifyContent:"space-between", flexShrink:0 
      }}>
        <div>
          <p style={{ margin:0, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:".8px" }}>Goals</p>
          <h1 style={{ margin:"2px 0 0", fontSize: isMobile ? 18 : 20, fontWeight:800, letterSpacing:"-0.4px" }}>
            Track your progress 🎯
          </h1>
        </div>
        <button onClick={()=>openCreate("shortterm")} style={{ display:"flex", alignItems:"center",
          gap:7, padding: isMobile ? "7px 14px" : "9px 18px", borderRadius:9, cursor:"pointer",
          background:C.accent, border:"none", color:"#000", fontWeight:700, fontSize: isMobile ? 13 : 14 }}>
          <Plus size={isMobile ? 14 : 16}/> New Goal
        </button>
      </header>

      <div style={{ flex:1, overflowY:"auto", padding: isMobile ? 16 : 28 }}>

        {/* Stats */}
        <div style={{ 
          display:"grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", // ✅ Stack on mobile
          gap: isMobile ? 10 : 14, 
          marginBottom: isMobile ? 20 : 28 
        }}>
          {[
            { label:"Active Goals",  value:activeCount,      color:C.blue,   emoji:"🎯" },
            { label:"Completed",     value:doneCount,        color:C.green,  emoji:"✅" },
            { label:"Avg. Progress", value:`${avgPct}%`,     color:C.accent, emoji:"📈" },
          ].map(s=>(
            <div key={s.label} style={{ 
              background:C.surface, borderRadius:12, 
              border:`1px solid ${C.border}`, 
              padding: isMobile ? "14px" : "16px",
              display:"flex", alignItems:"center", gap:14 
            }}>
              <span style={{ fontSize: isMobile ? 24 : 28 }}>{s.emoji}</span>
              <div>
                <p style={{ margin:0, fontSize: isMobile ? 20 : 24, fontWeight:800, color:s.color, letterSpacing:"-1px" }}>{s.value}</p>
                <p style={{ margin:0, fontSize:11, color:C.muted }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ BIG GOAL ══ */}
        <div style={{ marginBottom: isMobile ? 24 : 32 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Star size={16} color={C.accent}/>
              <h2 style={{ margin:0, fontSize:13, fontWeight:800, textTransform:"uppercase",
                letterSpacing:"1px", color:C.accent }}>Big Goal</h2>
            </div>
            <button onClick={()=>openCreate("big")} style={{ display:"flex", alignItems:"center", gap:5,
              padding:"5px 12px", borderRadius:7, cursor:"pointer",
              background:C.accentDim, border:`1px solid ${C.accent}44`,
              color:C.accent, fontSize:12, fontWeight:600 }}>
              <Plus size={12}/> Add
            </button>
          </div>

          {(grouped.big || []).length===0 ? (
            <div onClick={()=>openCreate("big")} style={{ 
              background:`radial-gradient(ellipse at 50% 0%,${C.accent}06 0%,${C.surface} 60%)`,
              borderRadius:12, 
              border:`1px dashed ${C.border}`, 
              padding: isMobile ? "20px" : "28px",
              textAlign:"center", cursor:"pointer",
            }}>
              <p style={{ margin:"0 0 8px", fontSize: isMobile ? 28 : 32 }}>🚀</p>
              <p style={{ margin:"0 0 4px", fontSize: isMobile ? 14 : 15, fontWeight:700, color:C.secondary }}>
                What's your big dream?
              </p>
              <p style={{ margin:0, fontSize:13, color:C.muted }}>
                Set your ultimate aspiration — Doctor, Scientist, Engineer…
              </p>
            </div>
          ) : (
            (grouped.big || []).map(g=>(
              <div key={g.id} style={{ 
                background:`radial-gradient(ellipse at 0% 50%,${g.color}10 0%,${C.surface} 55%)`,
                borderRadius:12, 
                border:`1px solid ${g.color}33`, 
                padding: isMobile ? "20px" : "28px 32px",
                position:"relative", marginBottom:12 
              }}>
                <div style={{ position:"absolute", top:16, right:16, display:"flex", gap:6 }}>
                  <button onClick={()=>setEditGoal(g)} style={{ padding:6, borderRadius:7,
                    background:"transparent", border:`1px solid ${C.border}`,
                    color:C.muted, cursor:"pointer", display:"flex" }}><Edit2 size={12}/></button>
                  <button onClick={()=>deleteGoal("big",g.id)} style={{ padding:6, borderRadius:7,
                    background:"transparent", border:`1px solid ${C.border}`,
                    color:C.muted, cursor:"pointer", display:"flex" }}><Trash2 size={12}/></button>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 14 : 20 }}>
                  <div style={{ fontSize: isMobile ? 40 : 54, lineHeight:1 }}>{g.emoji}</div>
                  <div>
                    <p style={{ margin:"0 0 4px", fontSize:11, color:g.color, fontWeight:700,
                      textTransform:"uppercase", letterSpacing:"1.5px" }}>Ultimate Aspiration</p>
                    <h2 style={{ margin:"0 0 8px", fontSize: isMobile ? 24 : 34, fontWeight:900,
                      letterSpacing:"-1.5px", color:C.text, lineHeight:1.1 }}>
                      {g.title}
                    </h2>
                    {g.description && (
                      <p style={{ margin:0, fontSize:14, color:C.secondary, lineHeight:1.6, maxWidth:500 }}>
                        {g.description}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ marginTop:18, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.muted }}>
                    Every short & long term goal below brings you closer to this. 💪
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:4, background:C.surface, borderRadius:9,
          padding:3, border:`1px solid ${C.border}`, marginBottom:24, width:"fit-content" }}>
          {["all","active","done"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 18px", borderRadius:7,
              cursor:"pointer",
              background: filter===f ? C.bg : "transparent",
              border: filter===f ? `1px solid ${C.border}` : "1px solid transparent",
              color: filter===f ? C.text : C.muted,
              fontSize:13, fontWeight: filter===f?600:400,
              textTransform:"capitalize", transition:"all .15s" }}>{f}</button>
          ))}
        </div>

        {/* Long Term + Short Term sections */}
        <Section typeConf={GOAL_TYPES[1]} goals={grouped.longterm || []} filter={filter} C={C}
          isMobile={isMobile} // ✅ Pass isMobile
          onAdd={()=>openCreate("longterm")} onEdit={setEditGoal}
          onDelete={deleteGoal} onLog={setLogGoal} onToggle={toggleDone}/>

        <Section typeConf={GOAL_TYPES[2]} goals={grouped.shortterm || []} filter={filter} C={C}
          isMobile={isMobile} // ✅ Pass isMobile
          onAdd={()=>openCreate("shortterm")} onEdit={setEditGoal}
          onDelete={deleteGoal} onLog={setLogGoal} onToggle={toggleDone}/>
      </div>

      {showCreate && (
        <GoalModal initial={{ type:initType }} C={C} onSave={saveGoal} onClose={()=>setShowCreate(false)}/>
      )}
      {editGoal && (
        <GoalModal initial={editGoal} C={C} onSave={saveGoal} onClose={()=>setEditGoal(null)}/>
      )}
      {logGoal && (
        <LogModal goal={logGoal} C={C}
          onSave={(amt) => logProgressHandler(logGoal.id, logGoal.type, amt)}
          onClose={()=>setLogGoal(null)}/>
      )}
    </div>
  );
}