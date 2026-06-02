import { useState } from "react";
import { useAuth }      from "../../store/AuthContext";
import { useFriends }   from "../../hooks/useFriends";
import {
  Search, UserPlus, X, Check, MessageSquare,
  Flame, Users, UserCheck, Compass,
  Zap, Loader,
} from "lucide-react";
import { useTheme } from "../../store/ThemeContext";
import { useIsMobile } from "../../hooks/useIsMobile"; // ✅ Added

/* ─── Avatar with deterministic colour ───────────────────────────── */
function Avatar({ name="?", C, size=44, fontSize=15, online=false }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const COLORS   = ["#EC4899","#3B82F6","#10B981","#A855F7","#F97316","#14B8A6","#667eea","#F59E0B"];
  const color    = COLORS[(name.charCodeAt(0)??0) % COLORS.length];
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:size*0.24,
        background:color, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize, fontWeight:800, color:"#fff",
        boxShadow:`0 2px 8px ${color}44`,
      }}>{initials}</div>
      {online && (
        <div style={{ position:"absolute", bottom:-1, right:-1, width:11, height:11,
          borderRadius:"50%", background:C.green, border:`2px solid ${C.surface}` }}/>
      )}
    </div>
  );
}

/* ─── Friend card ────────────────────────────────────────────────── */
function FriendCard({ friend, C, onRemove, onMessage }) {
  return (
    <div style={{ 
      background:C.surface, borderRadius:12,
      border:`1px solid ${C.border}`, padding:"18px"
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
        <Avatar name={friend.full_name ?? "?"} C={C} size={46} fontSize={16}/>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:700 }}>
            {friend.full_name ?? "Unknown"}
          </p>
          <p style={{ margin:"0 0 4px", fontSize:12, color:C.muted }}>
            {friend.grade ?? ""}{friend.grade && friend.subject ? " · " : ""}{friend.subject ?? ""}
          </p>
        </div>
        <button onClick={()=>onRemove(friend.friendshipId)} style={{ padding:5,
          borderRadius:7, background:"transparent", border:`1px solid ${C.border}`,
          color:C.muted, cursor:"pointer", display:"flex" }}>
          <X size={13}/>
        </button>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>onMessage()} style={{ flex:1, padding:"8px", borderRadius:8,
          cursor:"pointer", background:C.accentDim, border:`1px solid ${C.accent}33`,
          color:C.accent, fontSize:12, fontWeight:600,
          display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
          <MessageSquare size={13}/> Message
        </button>
      </div>
    </div>
  );
}

/* ─── Request card ───────────────────────────────────────────────── */
function RequestCard({ user, type, C, onAccept, onDecline }) {
  return (
    <div style={{ 
      background:C.surface, borderRadius:12,
      border:`1px solid ${C.border}`, padding:"14px 16px",
      display:"flex", alignItems:"center", gap:12 
    }}>
      <Avatar name={user.full_name ?? "?"} C={C} size={42} fontSize={14}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700 }}>
          {user.full_name ?? "Unknown"}
        </p>
        <p style={{ margin:0, fontSize:12, color:C.muted }}>
          {user.grade ?? ""}{user.grade && user.subject ? " · " : ""}{user.subject ?? ""}
        </p>
      </div>
      {type === "incoming" ? (
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={()=>onDecline(user.requestId)} style={{ width:34, height:34,
            borderRadius:8, cursor:"pointer", background:C.redDim,
            border:`1px solid ${C.red}33`, color:C.red,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={15}/>
          </button>
          <button onClick={()=>onAccept(user.requestId)} style={{ width:34, height:34,
            borderRadius:8, cursor:"pointer", background:C.greenDim,
            border:`1px solid ${C.green}33`, color:C.green,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Check size={15}/>
          </button>
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:C.muted, padding:"4px 10px",
            borderRadius:6, background:C.border }}>Pending</span>
          <button onClick={()=>onDecline(user.requestId)} style={{ padding:"5px 10px",
            borderRadius:7, cursor:"pointer", background:"transparent",
            border:`1px solid ${C.border}`, color:C.muted, fontSize:11 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Discover card ──────────────────────────────────────────────── */
function DiscoverCard({ user, sent, C, onAdd }) {
  return (
    <div style={{ 
      background:C.surface, borderRadius:12,
      border:`1px solid ${C.border}`, padding:"14px 16px",
      display:"flex", alignItems:"center", gap:12 
    }}>
      <Avatar name={user.full_name ?? "?"} C={C} size={42} fontSize={14}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700 }}>
          {user.full_name ?? "Unknown"}
        </p>
        <p style={{ margin:0, fontSize:12, color:C.muted }}>
          {user.grade ?? ""}{user.grade && user.subject ? " · " : ""}{user.subject ?? ""}
        </p>
      </div>
      <button onClick={()=>!sent && onAdd(user.id)} style={{
        padding:"7px 14px", borderRadius:8, flexShrink:0,
        cursor: sent ? "default" : "pointer",
        background: sent ? C.greenDim : C.accentDim,
        border:`1px solid ${sent ? C.green+"44" : C.accent+"44"}`,
        color: sent ? C.green : C.accent,
        fontSize:12, fontWeight:600,
        display:"flex", alignItems:"center", gap:5, transition:"all .2s" }}>
        {sent ? <><Check size={12}/> Sent</> : <><UserPlus size={12}/> Add</>}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function Friends() {
  /* ─── Design tokens ──────────────────────────────────────────────── */
  const { colors: C } = useTheme();
  const isMobile = useIsMobile(); // ✅ Added
  const { user }  = useAuth();
  const {
    friends, requests, loading, sentIds,
    sendRequest, acceptRequest, declineRequest, removeFriend,
    searchUsers,
  } = useFriends();

  const [tab,           setTab]           = useState("friends");
  const [friendSearch,  setFriendSearch]  = useState("");
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverResults, setDiscoverResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [msgToast,      setMsgToast]      = useState(false);

  /* ── Filter friends by search ── */
  const filteredFriends = friends.filter(f =>
    f.full_name?.toLowerCase().includes(friendSearch.toLowerCase()) ||
    f.subject?.toLowerCase().includes(friendSearch.toLowerCase())
  );

  /* ── Discover search ── */
  const handleDiscoverSearch = async (q) => {
    setDiscoverQuery(q);
    if (!q.trim()) { setDiscoverResults([]); return; }
    setSearching(true);
    const results = await searchUsers(q);
    /* Filter out existing friends */
    const friendIds = new Set(friends.map(f => f.id));
    setDiscoverResults(results.filter(r => !friendIds.has(r.id)));
    setSearching(false);
  };

  const showMessage = () => {
    setMsgToast(true);
    setTimeout(() => setMsgToast(false), 2500);
  };

  const TABS = [
    { key:"friends",  Icon:Users,     label:"Friends",  badge:friends.length              },
    { key:"requests", Icon:UserCheck, label:"Requests", badge:requests.incoming.length    },
    { key:"discover", Icon:Compass,   label:"Discover", badge:null                        },
  ];

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
            textTransform:"uppercase", letterSpacing:".8px" }}>Friends</p>
          <h1 style={{ margin:"2px 0 0", fontSize: isMobile ? 18 : 20, fontWeight:800, letterSpacing:"-0.4px" }}>
            Study Together 👥
          </h1>
        </div>
        {/* ✅ Hide stats on mobile to save space */}
        {!isMobile && (
          <div style={{ display:"flex", gap:20 }}>
            {[
              { label:"Friends",  value:friends.length,           color:C.blue   },
              { label:"Requests", value:requests.incoming.length, color:C.accent },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <p style={{ margin:0, fontSize:20, fontWeight:800, color:s.color }}>{s.value}</p>
                <p style={{ margin:0, fontSize:11, color:C.muted }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding: isMobile ? "0 16px 16px" : "0 28px 28px" }}>

        {/* Tab bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          gap:16, padding:"16px 0", position:"sticky", top:0,
          background:C.bg, zIndex:10,
          borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
          <div style={{ display:"flex", gap:2 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={()=>setTab(t.key)} style={{
                display:"flex", alignItems:"center", gap:6,
                padding: isMobile ? "7px 12px" : "8px 18px", // ✅ Smaller tabs on mobile
                borderRadius:8, cursor:"pointer",
                background: tab===t.key ? C.surface : "transparent",
                border:`1px solid ${tab===t.key ? C.border : "transparent"}`,
                color: tab===t.key ? C.text : C.muted,
                fontWeight: tab===t.key ? 600 : 400,
                fontSize: isMobile ? 13 : 14, transition:"all .15s" }}>
                <t.Icon size={15}/>{t.label}
                {t.badge > 0 && (
                  <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px",
                    borderRadius:20, minWidth:18, textAlign:"center",
                    background: tab===t.key ? C.accentDim : C.border,
                    color: tab===t.key ? C.accent : C.muted }}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>
          {tab === "friends" && (
            <div style={{ display:"flex", alignItems:"center", gap:8,
              background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:9, padding: isMobile ? "7px 10px" : "8px 14px", 
              minWidth: isMobile ? 160 : 240 }}>
              <Search size={14} color={C.muted}/>
              <input value={friendSearch} onChange={e=>setFriendSearch(e.target.value)}
                placeholder="Search friends…"
                style={{ background:"none", border:"none", color:C.text,
                  fontSize:13, outline:"none", flex:1 }}/>
            </div>
          )}
        </div>

        {/* ── FRIENDS TAB ── */}
        {tab === "friends" && (
          <>
            {loading ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                <Loader size={18} style={{ animation:"spin 1s linear infinite" }}/>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
                <p style={{ fontSize:30, margin:"0 0 10px" }}>👥</p>
                <p style={{ fontSize:15, fontWeight:700, color:C.secondary, margin:"0 0 6px" }}>
                  {friendSearch ? `No friends match "${friendSearch}"` : "No friends yet"}
                </p>
                <p style={{ fontSize:13, margin:"0 0 20px" }}>
                  Find study partners in the Discover tab
                </p>
                <button onClick={()=>setTab("discover")} style={{ padding:"10px 24px",
                  borderRadius:9, cursor:"pointer", background:C.accent,
                  border:"none", color:"#000", fontWeight:700, fontSize:13 }}>
                  Find Friends
                </button>
              </div>
            ) : (
              <div style={{ 
                display:"grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", // ✅ Mobile grid
                gap:14 
              }}>
                {filteredFriends.map(f => (
                  <FriendCard key={f.friendshipId} friend={f} C={C}
                    onRemove={removeFriend}
                    onMessage={showMessage}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === "requests" && (
          <div style={{ maxWidth: isMobile ? "100%" : 560 }}>
            {requests.incoming.length > 0 && (
              <>
                <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700,
                  color:C.muted, textTransform:"uppercase", letterSpacing:".6px" }}>
                  Incoming ({requests.incoming.length})
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                  {requests.incoming.map(u => (
                    <RequestCard key={u.requestId} user={u} type="incoming" C={C}
                      onAccept={acceptRequest} onDecline={declineRequest}/>
                  ))}
                </div>
              </>
            )}
            {requests.outgoing.length > 0 && (
              <>
                <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700,
                  color:C.muted, textTransform:"uppercase", letterSpacing:".6px" }}>
                  Sent ({requests.outgoing.length})
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {requests.outgoing.map(u => (
                    <RequestCard key={u.requestId} user={u} type="outgoing" C={C}
                      onAccept={acceptRequest} onDecline={declineRequest}/>
                  ))}
                </div>
              </>
            )}
            {requests.incoming.length === 0 && requests.outgoing.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
                <p style={{ fontSize:36, margin:"0 0 10px" }}>📭</p>
                <p style={{ fontSize:15, fontWeight:700, color:C.secondary, margin:"0 0 6px" }}>
                  No pending requests
                </p>
                <p style={{ fontSize:13 }}>
                  Discover study partners in the Discover tab
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && (
          <div style={{ maxWidth: isMobile ? "100%" : 560 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8,
              background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:9, padding:"10px 14px", marginBottom:22 }}>
              <Search size={14} color={C.muted}/>
              <input
                value={discoverQuery}
                onChange={e=>handleDiscoverSearch(e.target.value)}
                placeholder="Search by name…"
                style={{ background:"none", border:"none", color:C.text,
                  fontSize:13, outline:"none", flex:1 }}
                autoFocus
              />
              {searching && (
                <Loader size={14} color={C.muted}
                  style={{ animation:"spin 1s linear infinite", flexShrink:0 }}/>
              )}
            </div>

            {discoverResults.length === 0 && discoverQuery && !searching && (
              <p style={{ textAlign:"center", color:C.muted, fontSize:13 }}>
                No users found for "{discoverQuery}"
              </p>
            )}

            {discoverResults.length === 0 && !discoverQuery && (
              <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                <p style={{ fontSize:28, margin:"0 0 8px" }}>🔍</p>
                <p style={{ fontSize:13 }}>
                  Type a name above to find study partners
                </p>
              </div>
            )}

            {discoverResults.length > 0 && (
              <>
                <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700,
                  color:C.muted, textTransform:"uppercase", letterSpacing:".6px" }}>
                  Results ({discoverResults.length})
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {discoverResults.map(u => (
                    <DiscoverCard key={u.id} user={u} C={C}
                      sent={sentIds.has(u.id)}
                      onAdd={sendRequest}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Message toast */}
      {msgToast && (
        <div style={{ position:"fixed", bottom:28, left:"50%",
          transform:"translateX(-50%)",
          background:C.surface, border:`1px solid ${C.accent}44`,
          borderRadius:10, padding:"12px 20px",
          color:C.text, fontSize:13, fontWeight:600,
          display:"flex", alignItems:"center", gap:8,
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
          zIndex:300, animation:"slideUp .2s ease" }}>
          <MessageSquare size={14} color={C.accent}/>
          Opening chat… head to Chatroom!
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}