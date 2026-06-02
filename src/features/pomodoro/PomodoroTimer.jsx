import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, RotateCcw, SkipForward,
  Volume2, VolumeX, Target, X, Check,
  Plus, Minus, Coffee, Brain, Image, ChevronRight,
} from "lucide-react";
import { useProfile }  from "../../hooks/useProfile";
import { useSessions } from "../../hooks/useSessions";
import { useTheme } from "../../store/ThemeContext";
import { useIsMobile } from "../../hooks/useIsMobile"; // ✅ Added

/* ─── Quotes ─────────────────────────────────────────────────────── */
const QUOTES = [
  { text:"The secret of getting ahead is getting started.",                         author:"Mark Twain"         },
  { text:"It always seems impossible until it's done.",                             author:"Nelson Mandela"     },
  { text:"Don't watch the clock; do what it does. Keep going.",                     author:"Sam Levenson"       },
  { text:"Success is the sum of small efforts, repeated day in and day out.",       author:"Robert Collier"     },
  { text:"Believe you can and you're halfway there.",                               author:"Theodore Roosevelt" },
  { text:"The expert in anything was once a beginner.",                             author:"Helen Hayes"        },
  { text:"You don't have to be great to start, but you have to start to be great.", author:"Zig Ziglar"         },
  { text:"Energy and persistence conquer all things.",                              author:"Benjamin Franklin"  },
  { text:"Little by little, one travels far.",                                      author:"J.R.R. Tolkien"     },
  { text:"Study hard, for the well is deep and our brains are shallow.",            author:"Richard Baxter"     },
  { text:"The beautiful thing about learning is nobody can take it away from you.", author:"B.B. King"          },
  { text:"Hardships often prepare ordinary people for an extraordinary destiny.",   author:"C.S. Lewis"         },
  { text:"Wear your failure as a badge of courage, not a mask of shame.",           author:"Unknown"            },
  { text:"The more that you read, the more things you will know.",                  author:"Dr. Seuss"          },
  { text:"Push yourself, because no one else is going to do it for you.",           author:"Unknown"            },
];

/* ─── Background themes ──────────────────────────────────────────── */
const THEMES = [
  {
    id:"dark", name:"Night", icon:"🌙",
    bg:"#0B0D14",
    cardBg:"#12151F", cardBorder:"#1E2235",
    text:"#E8EAED", muted:"#6B7280",
  },
  {
    id:"forest", name:"Forest", icon:"🌲",
    bg:"linear-gradient(160deg,#040e07 0%,#071a0e 40%,#030a05 100%)",
    cardBg:"rgba(5,18,9,0.88)", cardBorder:"rgba(16,185,129,0.25)",
    text:"#d4f5e2", muted:"#6aad88",
  },
  {
    id:"ocean", name:"Ocean", icon:"🌊",
    bg:"linear-gradient(160deg,#020c18 0%,#041c36 50%,#020a14 100%)",
    cardBg:"rgba(3,14,28,0.88)", cardBorder:"rgba(59,130,246,0.25)",
    text:"#c8e8ff", muted:"#5a9fd4",
  },
  {
    id:"sunset", name:"Sunset", icon:"🌅",
    bg:"linear-gradient(160deg,#120404 0%,#1f0c08 40%,#12060a 100%)",
    cardBg:"rgba(20,5,5,0.88)", cardBorder:"rgba(249,115,22,0.25)",
    text:"#ffe8d0", muted:"#c4845a",
  },
  {
    id:"galaxy", name:"Galaxy", icon:"🌌",
    bg:"linear-gradient(160deg,#04040c 0%,#0c0820 50%,#040410 100%)",
    cardBg:"rgba(8,5,20,0.88)", cardBorder:"rgba(168,85,247,0.25)",
    text:"#e8d4ff", muted:"#9a70c4",
  },
  {
    id:"aurora", name:"Aurora", icon:"✨",
    bg:"linear-gradient(160deg,#020c0c 0%,#041c18 40%,#02100e 100%)",
    cardBg:"rgba(3,16,14,0.88)", cardBorder:"rgba(20,184,166,0.25)",
    text:"#c8fff5", muted:"#5ac4b4",
  },
  {
    id:"custom", name:"Custom", icon:"🖼️",
    bg:null,
    cardBg:"rgba(0,0,0,0.75)", cardBorder:"rgba(255,255,255,0.15)",
    text:"#E8EAED", muted:"#6B7280",
  },
];

/* ─── Accent colours per mode ────────────────────────────────────── */
const MODE_CFG = {
  focus:      { label:"Focus",       Icon:Brain,  color:"#F59E0B", dim:"rgba(245,158,11,0.15)"  },
  shortBreak: { label:"Short Break", Icon:Coffee, color:"#10B981", dim:"rgba(16,185,129,0.15)"  },
  longBreak:  { label:"Long Break",  Icon:Coffee, color:"#3B82F6", dim:"rgba(59,130,246,0.15)"  },
};

const pad = (n) => String(n).padStart(2, "0");

const fmtTime = (mins) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/* ─── SVG Ring ───────────────────────────────────────────────────── */
function Ring({ progress, color, size=260, stroke=10 }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }} aria-hidden>
      <circle cx={cx} cy={cx} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}/>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.max(0, Math.min(1, progress)))}
        style={{ transition:"stroke-dashoffset 1s linear, stroke .4s ease" }}
      />
    </svg>
  );
}

/* ─── Duration picker ────────────────────────────────────────────── */
function DurationPicker({ value, onChange, color, disabled, label }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(String(value));

  const commit = () => {
    const n = Math.max(1, Math.min(180, parseInt(draft) || 1));
    onChange(n);
    setEditing(false);
  };

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize:13, color:"inherit", opacity:.7 }}>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <button onClick={()=>{ if(!disabled) onChange(Math.max(1,value-1)); }}
          disabled={disabled}
          style={{ width:24, height:24, borderRadius:6, background:"transparent",
            border:`1px solid rgba(255,255,255,0.12)`, color:"inherit",
            cursor:disabled?"not-allowed":"pointer", fontSize:14,
            display:"flex", alignItems:"center", justifyContent:"center", opacity:disabled?.4:1 }}>
          <Minus size={11}/>
        </button>
        {editing ? (
          <input autoFocus type="number" min={1} max={180} value={draft}
            onChange={e=>setDraft(e.target.value)}
            onBlur={commit} onKeyDown={e=>e.key==="Enter"&&commit()}
            style={{ width:44, textAlign:"center", background:"rgba(0,0,0,0.3)",
              border:`1px solid ${color}`, borderRadius:6,
              color:"inherit", fontSize:13, fontWeight:700, outline:"none",
              padding:"2px 4px" }}/>
        ) : (
          <button onClick={()=>{ if(!disabled){ setEditing(true); setDraft(String(value)); }}}
            style={{ background:"transparent", border:"none", cursor:disabled?"default":"pointer",
              fontSize:13, fontWeight:700, color, minWidth:40, textAlign:"center" }}>
            {value}m
          </button>
        )}
        <button onClick={()=>{ if(!disabled) onChange(Math.min(180,value+1)); }}
          disabled={disabled}
          style={{ width:24, height:24, borderRadius:6, background:"transparent",
            border:`1px solid rgba(255,255,255,0.12)`, color:"inherit",
            cursor:disabled?"not-allowed":"pointer", fontSize:14,
            display:"flex", alignItems:"center", justifyContent:"center", opacity:disabled?.4:1 }}>
          <Plus size={11}/>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function PomodoroTimer() {
  const { theme: appTheme, toggleTheme, colors: C } = useTheme();
  const isMobile = useIsMobile(); // ✅ Added
  const { profile }                           = useProfile();
  const { add: saveSession, sessions: dbSessions,
          todaySessions: dbTodaySessions,
          todayMinutes: dbTodayMinutes }       = useSessions();

  /* ── Timer state ── */
  
  const [mode,       setMode]       = useState("focus");
  const [durations,  setDurations]  = useState({ focus:25, shortBreak:5, longBreak:15 });
  const [sessionCount, setSessionCount] = useState(4);
  const [timeLeft,   setTimeLeft]   = useState(25 * 60);
  const [running,    setRunning]    = useState(false);

  /* ── Session tracking ── */
  const [doneInCycle,  setDoneInCycle]  = useState(0);
  const [sessionLog,   setSessionLog]   = useState([]);
  const sessionSavedRef = useRef(false);

  /* ── Task ── */
  const [activeTask,     setActiveTask]     = useState(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  /* ── Quotes ── */
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  /* ── Sound ── */
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef(null);

  /* ── Background theme ── */
  const [themeId,      setThemeId]      = useState("dark");
  const [customBg,     setCustomBg]     = useState("");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgDraft,      setBgDraft]      = useState("");

  /* ── Derived values ── */
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const cfg   = MODE_CFG[mode];
  const totalSecs = durations[mode] * 60;
  const progress  = totalSecs > 0 ? timeLeft / totalSecs : 0;
  const pctDone   = Math.round((1 - progress) * 100);
  const isBreak   = mode !== "focus";
  const longBreakEnabled = sessionCount >= 3;
  const totalFocusMins = sessionCount * durations.focus;
  const shortBreaks    = Math.max(0, sessionCount - 1);
  const totalBreakMins = shortBreaks * durations.shortBreak
    + (longBreakEnabled ? durations.longBreak : 0);
  const bgStyle = themeId === "custom"
    ? customBg
      ? { backgroundImage:`url(${customBg})`, backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat" }
      : { background:"#0B0D14" }
    : { background: theme.bg };

  /* ── Notification helper ── */
  const sendNotification = useCallback((sessionMode) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const messages = {
        focus:      { title:"🍅 Focus session complete!", body:"Time for a break. Great work!" },
        shortBreak: { title:"☕ Break over!",              body:"Ready to focus again?"         },
        longBreak:  { title:"🌴 Long break over!",         body:"Refreshed and ready to go!"   },
      };
      const msg = messages[sessionMode] ?? messages.focus;
      new Notification(msg.title, {
        body: msg.body,
        icon: "/favicon.svg",
        badge:"/favicon.svg",
      });
    }
  }, []);

  /* ── Persist state ── */
  useEffect(() => {
    const saved = localStorage.getItem("pomodoro_state");
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      if (Date.now() - s.savedAt < 2 * 60 * 60 * 1000) {
        setMode(s.mode ?? "focus");
        setDurations(s.durations ?? { focus:25, shortBreak:5, longBreak:15 });
        setSessionCount(s.sessionCount ?? 4);
        setTimeLeft(s.timeLeft ?? s.durations?.focus * 60 ?? 1500);
        setDoneInCycle(s.doneInCycle ?? 0);
        setThemeId(s.themeId ?? "dark");
        setCustomBg(s.customBg ?? "");
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    localStorage.setItem("pomodoro_state", JSON.stringify({
      mode, durations, sessionCount, timeLeft, doneInCycle,
      themeId, customBg, savedAt: Date.now(),
    }));
  }, [mode, durations, sessionCount, timeLeft, doneInCycle, themeId, customBg]);

  // Warn on leaving mid-session
  useEffect(() => {
    const handler = (e) => {
      if (running) { e.preventDefault(); e.returnValue = "Timer is running!"; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [running]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ── Tick ── */
  useEffect(()=>{
    if (!running){ clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(()=>{
      setTimeLeft(prev=>{
        if (prev <= 1){
          clearInterval(intervalRef.current);
          setRunning(false);
          sendNotification(mode);

          if (mode==="focus" && !sessionSavedRef.current){
            sessionSavedRef.current = true;
            saveSession(activeTask?.text ?? "Free study", durations.focus);
            setSessionLog(log=>[...log,{
              id:      Date.now(),
              time:    new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
              task:    activeTask?.text ?? "Free study",
              duration:durations.focus,
            }]);
            setDoneInCycle(n => n + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    },1000);
    return ()=>clearInterval(intervalRef.current);
  },[running, mode, durations, sendNotification, activeTask, saveSession]);

  /* ── Switch mode ── */
  const switchMode = (m) => {
    if (m==="longBreak" && !longBreakEnabled) return;
    clearInterval(intervalRef.current);
    setMode(m); setRunning(false);
    setTimeLeft(durations[m]*60);
    sessionSavedRef.current = false;
    if (m!=="focus") setQuoteIdx(Math.floor(Math.random()*QUOTES.length));
  };

  /* ── When duration changes reset if stopped ── */
  const setDuration = (m, val) => {
    setDurations(d=>({...d,[m]:val}));
    if (!running && mode===m) setTimeLeft(val*60);
  };

  /* ── Reset ── */
  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    sessionSavedRef.current = false;
    setTimeLeft(durations[mode]*60);
  };

  /* ── Play / Pause — auto-reset if at 0 ── */
  const handlePlayPause = () => {
    if (!running && timeLeft === 0){
      sessionSavedRef.current = false;
      setTimeLeft(durations[mode]*60);
      setTimeout(()=>setRunning(true), 50);
      return;
    }
    setRunning(r=>!r);
  };

  /* ── Skip ── */
  const skip = () => {
    if (mode==="focus"){
      const next = longBreakEnabled && doneInCycle >= sessionCount - 1
        ? "longBreak" : "shortBreak";
      switchMode(next);
    } else {
      switchMode("focus");
    }
  };

  /* ── Sample tasks ── */
  const TASKS = [
    { id:1, text:"Complete Calculus Chapter 5"   },
    { id:2, text:"Write Physics lab report"       },
    { id:3, text:"Read English literature essay"  },
    { id:4, text:"Review History flashcards"      },
  ];

  /* ── Card style using theme ── */
  const cardStyle = (extra={}) => ({
    background:   theme.cardBg,
    borderRadius: 12,
    border:       `1px solid ${theme.cardBorder}`,
    backdropFilter:"blur(12px)",
    ...extra,
  });

  return (
    <div style={{
      minHeight:"100vh", color:theme.text,
      fontFamily:'"Geist","SF Pro Display",-apple-system,sans-serif',
      display:"flex", flexDirection:"column",
      position:"relative", overflow:"hidden",
      ...bgStyle,
    }}>
      {/* Background overlay for readability */}
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.25)",
        pointerEvents:"none", zIndex:0 }}/>

      {/* ── Header ── */}
      <header style={{ position:"relative", zIndex:1,
        padding: isMobile ? "10px 16px" : "14px 24px",
        background:theme.cardBg,
        borderBottom:`1px solid ${theme.cardBorder}`,
        backdropFilter:"blur(12px)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexShrink:0 }}>
        <div>
          <p style={{ margin:0, fontSize:11, opacity:.5,
            textTransform:"uppercase", letterSpacing:".8px" }}>Pomodoro Timer</p>
          <h1 style={{ margin:"2px 0 0", fontSize: isMobile ? 16 : 19, fontWeight:800, letterSpacing:"-0.4px" }}>
            Stay in the zone 🍅
          </h1>
        </div>
        <div style={{ display:"flex", gap: isMobile ? 4 : 8 }}>
          <button onClick={()=>setShowBgPicker(s=>!s)} style={{
            padding: isMobile ? "5px 8px" : "7px 12px", borderRadius:8,
            background: showBgPicker ? cfg.dim : "transparent",
            border:`1px solid ${theme.cardBorder}`,
            color:theme.text, cursor:"pointer", fontSize: isMobile ? 10 : 12, fontWeight:600,
            display:"flex", alignItems:"center", gap:5, opacity:.8 }}>
            <Image size={isMobile ? 12 : 14}/> {!isMobile && "Background"}
          </button>
          <button onClick={()=>setMuted(m=>!m)} style={{ padding: isMobile ? 6 : 8, borderRadius:8,
            background:"transparent", border:`1px solid ${theme.cardBorder}`,
            color:theme.text, cursor:"pointer", display:"flex", alignItems:"center",
            opacity:.7 }}>
            {muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}
          </button>
        </div>
      </header>

      {/* ── Background picker ── */}
      {showBgPicker && (
        <div style={{ position:"relative", zIndex:2,
          padding: isMobile ? "10px 16px" : "14px 24px",
          background:theme.cardBg, backdropFilter:"blur(12px)",
          borderBottom:`1px solid ${theme.cardBorder}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {THEMES.map(t => (
              <button key={t.id} onClick={()=>setThemeId(t.id)} style={{
                display:"flex", alignItems:"center", gap:6,
                padding: isMobile ? "5px 8px" : "6px 12px", borderRadius:8, cursor:"pointer",
                background: themeId===t.id ? cfg.dim : "rgba(255,255,255,0.06)",
                border:`1px solid ${themeId===t.id ? cfg.color+"66" : "rgba(255,255,255,0.1)"}`,
                color:theme.text, fontSize: isMobile ? 11 : 12, fontWeight: themeId===t.id?700:400 }}>
                {t.icon} {t.name}
              </button>
            ))}
            {themeId==="custom" && (
              <div style={{ display:"flex", gap:8, flex:1, minWidth:200 }}>
                <input value={bgDraft} onChange={e=>setBgDraft(e.target.value)}
                  placeholder="Paste image URL…"
                  style={{ flex:1, background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.15)",
                    borderRadius:8, padding:"6px 12px", color:"#fff", fontSize:13, outline:"none" }}/>
                <button onClick={()=>{
                 setCustomBg(bgDraft);
                 setThemeId("custom");
                 setShowBgPicker(false);
                  }}
                  style={{ padding:"6px 14px", borderRadius:8, background:cfg.color,
                    border:"none", color:"#000", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ 
        flex:1, position:"relative", zIndex:1, 
        padding: isMobile ? "16px" : "24px",
        display:"grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", // ✅ Stack on mobile
        gap: isMobile ? 14 : 20, 
        alignItems:"start",
        overflowY:"auto" 
      }}>

        {/* LEFT: Timer */}
        <div style={{ display:"flex", flexDirection:"column", gap: isMobile ? 12 : 16 }}>

          {/* Mode tabs */}
          <div style={{ display:"flex", gap: isMobile ? 4 : 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {Object.entries(MODE_CFG).map(([key,m])=>{
              const active  = mode===key;
              const disabled = key==="longBreak" && !longBreakEnabled;
              return (
                <button key={key} onClick={()=>!disabled&&switchMode(key)}
                  disabled={disabled}
                  style={{ display:"flex", alignItems:"center", gap:6,
                    padding: isMobile ? "6px 10px" : "8px 18px", borderRadius:8,
                    cursor: disabled?"not-allowed":"pointer",
                    background: active ? m.dim : "rgba(255,255,255,0.05)",
                    border:`1px solid ${active ? m.color+"66" : "rgba(255,255,255,0.1)"}`,
                    color: disabled ? "rgba(255,255,255,0.2)" : active ? m.color : "rgba(255,255,255,0.5)",
                    fontSize: isMobile ? 11 : 13, fontWeight:active?700:400, transition:"all .2s",
                    opacity: disabled?.5:1 }}>
                  <m.Icon size={isMobile ? 11 : 13}/>{m.label}
                  {key==="longBreak" && !longBreakEnabled && (
                    <span style={{ fontSize:10, opacity:.6 }}>(3+ sessions)</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Timer card */}
          <div style={{ ...cardStyle({ padding: isMobile ? "24px 20px" : "40px 32px" }),
            display:"flex", flexDirection:"column", alignItems:"center", gap: isMobile ? 18 : 26,
            background: `radial-gradient(ellipse at 50% 0%, ${cfg.color}12 0%, ${theme.cardBg} 55%)` }}>

            {/* Ring */}
            <div style={{ position:"relative", width: isMobile ? 220 : 260, height: isMobile ? 220 : 260 }}>
              <Ring progress={progress} color={cfg.color}
                size={isMobile ? 220 : 260} stroke={isMobile ? 8 : 10}/>
              {/* Glow */}
              <div style={{ position:"absolute", inset:0, borderRadius:"50%",
                pointerEvents:"none",
                boxShadow: running ? `0 0 80px 15px ${cfg.color}28` : "none",
                transition:"box-shadow .6s ease" }}/>
              {/* Center */}
              <div style={{ position:"absolute", inset:0,
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:4 }}>
                <div style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8, borderRadius:"50%",
                  background: running ? cfg.color : "transparent",
                  marginBottom:2,
                  animation: running ? "pulse 1.4s ease-in-out infinite" : "none" }}/>
                <span style={{ fontSize: isMobile ? 46 : 58, fontWeight:800, letterSpacing:"-4px",
                  color:theme.text, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>
                  {pad(Math.floor(timeLeft/60))}:{pad(timeLeft%60)}
                </span>
                <span style={{ fontSize:11, color:cfg.color, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"2.5px" }}>{cfg.label}</span>
                <span style={{ fontSize:11, opacity:.5 }}>
                  {timeLeft===0 ? "Done! Hit play to restart" : `${pctDone}% complete`}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 10 : 14 }}>
              <button onClick={reset} title="Reset" style={{ width: isMobile ? 40 : 44, height: isMobile ? 40 : 44,
                borderRadius:12, background:"rgba(255,255,255,0.05)",
                border:`1px solid rgba(255,255,255,0.1)`,
                color:theme.text, cursor:"pointer", opacity:.7,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <RotateCcw size={isMobile ? 15 : 17}/>
              </button>

              <button onClick={handlePlayPause} style={{ width: isMobile ? 60 : 70, height: isMobile ? 60 : 70,
                borderRadius:20, background:cfg.color, border:"none", color:"#000",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                transform: running ? "scale(1.06)" : "scale(1)",
                boxShadow: running ? `0 8px 32px ${cfg.color}66` : `0 4px 16px ${cfg.color}44`,
                transition:"all .25s cubic-bezier(.34,1.56,.64,1)" }}>
                {running
                  ? <Pause size={isMobile ? 22 : 26} fill="#000" strokeWidth={0}/>
                  : <Play  size={isMobile ? 22 : 26} fill="#000" strokeWidth={0} style={{ marginLeft:3 }}/>}
              </button>

              <button onClick={skip} title="Skip" style={{ width: isMobile ? 40 : 44, height: isMobile ? 40 : 44,
                borderRadius:12, background:"rgba(255,255,255,0.05)",
                border:`1px solid rgba(255,255,255,0.1)`,
                color:theme.text, cursor:"pointer", opacity:.7,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <SkipForward size={isMobile ? 15 : 17}/>
              </button>
            </div>

            {/* Task chip */}
            <button onClick={()=>setShowTaskPicker(true)} style={{
              display:"flex", alignItems:"center", gap:8, padding: isMobile ? "6px 12px" : "8px 16px",
              borderRadius:20, cursor:"pointer",
              background: activeTask ? cfg.dim : "rgba(255,255,255,0.05)",
              border:`1px solid ${activeTask ? cfg.color+"44" : "rgba(255,255,255,0.1)"}`,
              color: activeTask ? cfg.color : "rgba(255,255,255,0.4)",
              fontSize:12, fontWeight:500, maxWidth: isMobile ? 280 : 360, transition:"all .2s" }}>
              <Target size={12}/>
              <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {activeTask ? activeTask.text : "No task selected — click to pick one"}
              </span>
              {activeTask && (
                <span onClick={e=>{ e.stopPropagation(); setActiveTask(null); }}
                  style={{ display:"flex", alignItems:"center" }}>
                  <X size={11}/>
                </span>
              )}
            </button>

            {/* Cycle dots */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", gap: isMobile ? 6 : 8 }}>
                {Array.from({ length:sessionCount }).map((_,i) => (
                  <div key={i} style={{ fontSize: isMobile ? 14 : 16,
                    opacity: i < doneInCycle ? 1 : 0.2,
                    filter:  i < doneInCycle ? "none" : "grayscale(1)",
                    transition:"opacity .35s" }}>🍅</div>
                ))}
              </div>
              <p style={{ margin:0, fontSize:11, opacity:.4 }}>
                {doneInCycle} / {sessionCount} sessions complete
              </p>
            </div>

            {/* Break quote */}
            {isBreak && (
              <div style={{ width:"100%", maxWidth: isMobile ? "100%" : 440,
                background:`${cfg.color}10`,
                border:`1px solid ${cfg.color}33`,
                borderRadius:14, padding: isMobile ? "14px 16px" : "20px 24px", textAlign:"center",
                animation:"fadeIn .5s ease" }}>
                <p style={{ margin:"0 0 6px", fontSize:20 }}>💬</p>
                <p style={{ margin:"0 0 10px", fontSize: isMobile ? 13 : 14, fontWeight:600,
                  color:theme.text, lineHeight:1.65, fontStyle:"italic" }}>
                  "{QUOTES[quoteIdx].text}"
                </p>
                <p style={{ margin:"0 0 14px", fontSize:12, opacity:.5 }}>
                  — {QUOTES[quoteIdx].author}
                </p>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"center", gap:10 }}>
                  <button onClick={()=>setQuoteIdx(i=>(i-1+QUOTES.length)%QUOTES.length)}
                    style={{ width:30, height:30, borderRadius:7, background:"transparent",
                      border:`1px solid ${cfg.color}44`, color:cfg.color, cursor:"pointer",
                      fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    ‹
                  </button>
                  <span style={{ fontSize:11, opacity:.4 }}>
                    {quoteIdx+1} / {QUOTES.length}
                  </span>
                  <button onClick={()=>setQuoteIdx(i=>(i+1)%QUOTES.length)}
                    style={{ width:30, height:30, borderRadius:7, background:"transparent",
                      border:`1px solid ${cfg.color}44`, color:cfg.color, cursor:"pointer",
                      fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap: isMobile ? 10 : 14 }}>

          {/* Session & Duration settings */}
          <div style={{ ...cardStyle({ padding: isMobile ? "14px" : "18px" }) }}>
            <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:700,
              textTransform:"uppercase", letterSpacing:".7px", opacity:.5 }}>
              Session Settings
            </p>

            {/* Session count */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.06)",
              marginBottom:4 }}>
              <span style={{ fontSize:13, opacity:.7 }}>Sessions per cycle</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={()=>setSessionCount(s=>Math.max(1,s-1))}
                  style={{ width:24, height:24, borderRadius:6, background:"transparent",
                    border:`1px solid rgba(255,255,255,0.12)`, color:"inherit",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Minus size={11}/>
                </button>
                <span style={{ fontSize:14, fontWeight:800, color:cfg.color, minWidth:20,
                  textAlign:"center" }}>{sessionCount}</span>
                <button onClick={()=>setSessionCount(s=>Math.min(8,s+1))}
                  style={{ width:24, height:24, borderRadius:6, background:"transparent",
                    border:`1px solid rgba(255,255,255,0.12)`, color:"inherit",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Plus size={11}/>
                </button>
              </div>
            </div>

            <DurationPicker label="🍅 Focus" value={durations.focus}
              onChange={v=>setDuration("focus",v)} color="#F59E0B" disabled={running&&mode==="focus"}/>
            <DurationPicker label="☕ Short Break" value={durations.shortBreak}
              onChange={v=>setDuration("shortBreak",v)} color="#10B981"
              disabled={running&&mode==="shortBreak"}/>
            <DurationPicker label="🌴 Long Break" value={durations.longBreak}
              onChange={v=>setDuration("longBreak",v)} color="#3B82F6"
              disabled={(running&&mode==="longBreak")||!longBreakEnabled}/>

            {/* Total time */}
            <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8,
              background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin:"0 0 6px", fontSize:11, opacity:.5,
                textTransform:"uppercase", letterSpacing:".5px" }}>
                Cycle Total
              </p>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div style={{ textAlign:"center" }}>
                  <p style={{ margin:0, fontSize: isMobile ? 14 : 16, fontWeight:800, color:"#F59E0B" }}>
                    {fmtTime(totalFocusMins)}
                  </p>
                  <p style={{ margin:0, fontSize:10, opacity:.4 }}>Focus</p>
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ margin:0, fontSize: isMobile ? 14 : 16, fontWeight:800, color:"#10B981" }}>
                    {fmtTime(totalBreakMins)}
                  </p>
                  <p style={{ margin:0, fontSize:10, opacity:.4 }}>Breaks</p>
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ margin:0, fontSize: isMobile ? 14 : 16, fontWeight:800, color:theme.text }}>
                    {fmtTime(totalFocusMins + totalBreakMins)}
                  </p>
                  <p style={{ margin:0, fontSize:10, opacity:.4 }}>Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's stats */}
          <div style={cardStyle({ padding: isMobile ? "14px" : "16px" })}>
            <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700,
              textTransform:"uppercase", letterSpacing:".7px", opacity:.5 }}>
              Today's Stats
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"Sessions",   value:dbTodaySessions,           emoji:"🍅", color:"#F59E0B" },
                { label:"Focus time", value:`${dbTodayMinutes}m`,      emoji:"⏱️", color:"#3B82F6" },
                { label:"Streak",     value:`${profile?.streak??0}d`,  emoji:"🔥", color:"#F59E0B" },
                { label:"All time",   value:`${dbSessions.length}`,    emoji:"📊", color:"#10B981" },
              ].map(s => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.04)",
                  borderRadius:8, padding: isMobile ? "8px" : "10px",
                  border:"1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ margin:"0 0 3px", fontSize: isMobile ? 15 : 18 }}>{s.emoji}</p>
                  <p style={{ margin:"0 0 2px", fontSize: isMobile ? 15 : 18, fontWeight:800,
                    color:s.color, letterSpacing:"-0.5px" }}>{s.value}</p>
                  <p style={{ margin:0, fontSize:10, opacity:.4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pomodoro Guide */}
          <div style={cardStyle({ padding: isMobile ? "14px" : "16px" })}>
            <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700,
              textTransform:"uppercase", letterSpacing:".7px", opacity:.5 }}>
              Pomodoro Technique
            </p>
            {[
              { emoji:"🍅", text:"Work for 25 minutes, fully focused"  },
              { emoji:"☕", text:"Take a 5-minute short break"           },
              { emoji:"🔄", text:"Repeat 4 times per cycle"             },
              { emoji:"🌴", text:"Take a 15-30 minute long break"       },
            ].map((r,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10,
                padding:"6px 0",
                borderBottom: i<3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize:15, flexShrink:0 }}>{r.emoji}</span>
                <span style={{ fontSize:12, opacity:.65, lineHeight:1.5 }}>{r.text}</span>
              </div>
            ))}
          </div>

          {/* Session log */}
          <div style={{ ...cardStyle({ padding: isMobile ? "14px" : "16px" }), flex:1 }}>
            <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700,
              textTransform:"uppercase", letterSpacing:".7px", opacity:.5 }}>
              Session Log
            </p>
            {dbSessions.length===0 && sessionLog.length===0 ? (
              <div style={{ textAlign:"center", padding:"16px 0", opacity:.4 }}>
                <p style={{ margin:"0 0 4px", fontSize:24 }}>🍅</p>
                <p style={{ margin:0, fontSize:12 }}>Complete a session to see your log</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6,
                maxHeight: isMobile ? 150 : 200, overflowY:"auto" }}>
                {[...dbSessions.slice(0,5), ...sessionLog].reverse().map((log,i)=>(
                  <div key={log.id??i} style={{ display:"flex", alignItems:"center", gap:8,
                    padding:"8px 10px", borderRadius:8,
                    background:"rgba(255,255,255,0.04)",
                    border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize:13 }}>🍅</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:11, fontWeight:500,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        opacity:.8 }}>
                        {log.task_name ?? log.task}
                      </p>
                      <p style={{ margin:0, fontSize:10, opacity:.4 }}>
                        {log.completed_at
                          ? new Date(log.completed_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})
                          : log.time
                        } · {log.duration_minutes ?? log.duration}m
                      </p>
                    </div>
                    <Check size={11} color="#10B981"/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Task picker ── */}
      {showTaskPicker && (
        <div onClick={()=>setShowTaskPicker(false)} style={{ position:"fixed", inset:0,
          background:"rgba(0,0,0,0.7)", display:"flex",
          alignItems:"flex-end", justifyContent:"center", zIndex:200 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#12151F",
            borderRadius:"16px 16px 0 0", border:"1px solid #1E2235",
            padding: isMobile ? "20px 20px 28px" : "24px 24px 36px", 
            width:"100%", maxWidth: isMobile ? "100%" : 540 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:"#E8EAED" }}>
                Focus on a task
              </h2>
              <button onClick={()=>setShowTaskPicker(false)} style={{ background:"none",
                border:"none", color:"#6B7280", cursor:"pointer" }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {TASKS.map(t=>{
                const sel=activeTask?.id===t.id;
                return (
                  <button key={t.id}
                    onClick={()=>{ setActiveTask(t); setShowTaskPicker(false); }}
                    style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"13px 14px", borderRadius:10, cursor:"pointer",
                      textAlign:"left",
                      background: sel ? cfg.dim : "#0B0D14",
                      border:`1px solid ${sel ? cfg.color+"55" : "#1E2235"}`,
                      color: sel ? cfg.color : "#E8EAED", transition:"all .15s" }}>
                    <Target size={14}/>
                    <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{t.text}</span>
                    {sel && <Check size={14}/>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}