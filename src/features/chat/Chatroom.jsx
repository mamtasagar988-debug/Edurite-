import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../store/AuthContext";
import { supabase } from "../../services/supabase";
import {
  Hash, Send, Smile, Pin, Users, Search,
  Settings, ChevronDown, ChevronRight, Loader,
} from "lucide-react";
import { useTheme } from "../../store/ThemeContext";
import { useIsMobile } from "../../hooks/useIsMobile";

/* ─── Channel config ─────────────────────────────────────────────── */
const CHANNELS = [
  { id:"general",     name:"general",     desc:"General study chat",                pinned:"📌 Welcome to Edurite! Keep it productive 🎯"            },
  { id:"mathematics", name:"mathematics", desc:"Calculus, Algebra, Stats & more",   pinned:"📌 Weekly challenge: Solve ∫x²sin(x)dx by Friday!"         },
  { id:"physics",     name:"physics",     desc:"Mechanics, Electromagnetism & more", pinned:"📌 Physics test Thursday — share notes here"               },
  { id:"chemistry",   name:"chemistry",   desc:"Organic, Inorganic & Physical",     pinned:null                                                         },
  { id:"english-lit", name:"english-lit", desc:"Essays, poetry & analysis",         pinned:null                                                         },
  { id:"study-tips",  name:"study-tips",  desc:"Best study strategies",             pinned:"📌 Pomodoro + Anki = 💯"                                    },
];

/* ─── Emoji data ─────────────────────────────────────────────────── */
const EMOJIS       = ["😀","😂","😍","🤔","😭","🔥","💪","👍","❤️","🎉","💡","✅","📚","🍅","🎯","⭐","🙌","💯","🚀","🧠","⏱️","😅","😤","😊","🤯","💜"];
const QUICK_REACT  = ["👍","🔥","💡","🎉","❤️","😂"];

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ name, C, size=34, fontSize=12, online=false }) {
  const initials = name
    ? name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
    : "?";
  const COLORS = ["#EC4899","#3B82F6","#10B981","#A855F7","#F97316","#14B8A6","#667eea","#F59E0B"];
  const color  = COLORS[(name?.charCodeAt(0)??0) % COLORS.length];

  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:size*0.27,
        background:color, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize, fontWeight:800, color:"#fff",
      }}>{initials}</div>
      {online && (
        <div style={{ position:"absolute", bottom:-1, right:-1, width:9, height:9,
          borderRadius:"50%", background:C.green, border:`2px solid ${C.surface}` }}/>
      )}
    </div>
  );
}

/* ─── Single message row ─────────────────────────────────────────── */
function Message({ msg, C, user, isMe, showAvatar, onReact }) {
  const name   = msg.profiles?.full_name ?? "Unknown";
  const time   = new Date(msg.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const [hover, setHover] = useState(false);
  
  const msgReactions = msg.reactions || {};
  const hasReactions = Object.keys(msgReactions).length > 0;

  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:"flex", gap:10, padding:"3px 16px",
        background: hover ? "rgba(255,255,255,0.018)" : "transparent",
        position:"relative", marginBottom: showAvatar ? 4 : 0 }}>

      <div style={{ width:34, flexShrink:0, paddingTop:2 }}>
        {showAvatar && <Avatar name={name} C={C} />}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {showAvatar && (
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:2 }}>
            <span style={{ fontSize:13, fontWeight:700,
              color: isMe ? C.accent : C.text }}>
              {name}{isMe ? " (You)" : ""}
            </span>
            <span style={{ fontSize:11, color:C.muted }}>{time}</span>
          </div>
        )}
        <p style={{ margin:0, fontSize:14, lineHeight:1.65,
          color:C.text, wordBreak:"break-word" }}>
          {msg.text}
        </p>

        {hasReactions && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
            {Object.entries(msgReactions).map(([emoji, users]) => {
              const mine = Array.isArray(users) && users.includes(user?.id);
              return (
                <button key={emoji} onClick={()=>onReact(msg.id, emoji)} style={{
                  display:"flex", alignItems:"center", gap:4, padding:"2px 8px",
                  borderRadius:20, cursor:"pointer",
                  background: mine ? C.accentDim : "rgba(255,255,255,0.05)",
                  border:`1px solid ${mine ? C.accent+"55" : C.border}`,
                  fontSize:13, color: mine ? C.accent : C.secondary,
                  transition:"all .15s" }}>
                  {emoji} <span style={{ fontSize:11, fontWeight:600 }}>{(users || []).length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hover && (
        <div style={{ position:"absolute", right:16, top:0, display:"flex", gap:2,
          background:C.surface, border:`1px solid ${C.border}`,
          borderRadius:8, padding:3, zIndex:10 }}>
          {QUICK_REACT.map(e => (
            <button key={e} onClick={()=>onReact(msg.id, e)} style={{
              background:"none", border:"none", cursor:"pointer",
              fontSize:15, padding:"2px 4px", borderRadius:4 }}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Chatroom() {
  const { colors: C } = useTheme();
  const { user } = useAuth();
  const myName   = user?.user_metadata?.full_name ?? user?.email ?? "You";
  const isMobile = useIsMobile();
  const [showChannels, setShowChannels] = useState(false);

  /* ── State ── */
  const [activeCh,    setActiveCh]    = useState("general");
  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [collapsed,   setCollapsed]   = useState({ ch:false, dm:false });
  const [search,      setSearch]      = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  /* Local reactions */
  const [reactions, setReactions] = useState({});

  const bottomRef         = useRef(null);
  const inputRef          = useRef(null);
  const subscriptionRef   = useRef(null);
  const currentChannelRef = useRef(activeCh);
  const isFirstLoadRef    = useRef(true);

  const channel = CHANNELS.find(c => c.id === activeCh);

  /* ── Switch channel ── */
  const switchCh = (id) => {
    setActiveCh(id);
    setShowEmoji(false);
    setSearch("");
    if (isMobile) setShowChannels(false);
  };

  /* ── Load messages ── */
  const loadMessages = useCallback(async (ch) => {
    setLoading(true);
    
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("channel", ch)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data && data.length > 0) {
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
      
      // Attach profile to each message
      const messagesWithProfiles = data.map(msg => ({
       ...msg,
       profiles: profileMap[msg.user_id] || null,
       reactions: msg.reactions || {}  // Ensure reactions is always an object
}));
      
      setMessages(messagesWithProfiles);
    } else {
      setMessages([]);
    }
    
    setLoading(false);
    isFirstLoadRef.current = false;
  }, []);

  /* ── Subscribe to real-time inserts ── */
  const subscribe = useCallback((ch) => {
    // Clean up previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    const sub = supabase
      .channel(`room:${ch}`)
      .on("postgres_changes", {
        event:  "INSERT",
        schema: "public",
        table:  "messages",
        filter: `channel=eq.${ch}`,
      }, async (payload) => {
        const newMsg = payload.new;
        
        // Skip own messages (already added via sendMessage)
        if (newMsg.user_id === user?.id) return;
        
        // Only add if still in same channel
        if (currentChannelRef.current !== ch) return;

        // Fetch profile for the new message
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", newMsg.user_id)
          .single();

        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, profiles: profileData }];
        });
      })
      .subscribe();

    subscriptionRef.current = sub;
  }, [user?.id]);

  /* ── Load + subscribe on channel change ── */
  useEffect(() => {
    currentChannelRef.current = activeCh;
    loadMessages(activeCh);
    subscribe(activeCh);
    
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [activeCh, loadMessages, subscribe]);

  /* ── Presence ── */
useEffect(() => {
    if (!user) return;
    
    // Get a display-friendly name
    const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? "User";
    
    const presence = supabase.channel("online_users")
      .on("presence", { event:"sync" }, () => {
        const state = presence.presenceState();
        const users = Object.values(state).flat().map(u => ({
          name: u.name,
          userId: u.userId
        })).filter(u => u.userId !== user.id); // Filter out yourself
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presence.track({ 
            name: displayName, 
            userId: user.id 
          });
        }
      });
    return () => supabase.removeChannel(presence);
  }, [user]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  /* ── Send message ── */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    
    setSending(true);
    setInput("");
    setShowEmoji(false);

    try {
      // Insert message
      const { data: insertedData, error: insertError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          channel: activeCh,
          text: text,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert failed:", insertError);
        setInput(text);
        setSending(false);
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Build complete message
      const newMessage = {
        ...insertedData,
        profiles: profileData || { full_name: myName },
      };

      // Add to messages immediately
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    } catch (err) {
      console.error("Send error:", err);
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  /* ── Reactions ── */
const handleReact = async (msgId, emoji) => {
    if (!user) return;
    
    // Find the message in state
    const message = messages.find(m => m.id === msgId);
    if (!message) return;
    
    // Get current reactions for this message
    const currentReactions = message.reactions || {};
    const emojiUsers = currentReactions[emoji] || [];
    const hasReacted = emojiUsers.includes(user.id);
    
    // Toggle reaction
    const updatedEmojiUsers = hasReacted
      ? emojiUsers.filter(id => id !== user.id)
      : [...emojiUsers, user.id];
    
    // Update reactions object
    let updatedReactions = { ...currentReactions };
    if (updatedEmojiUsers.length > 0) {
      updatedReactions[emoji] = updatedEmojiUsers;
    } else {
      delete updatedReactions[emoji];
    }
    
    // Optimistic update in local state
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, reactions: updatedReactions } : m
    ));
    
    // Persist to database
    await supabase
      .from("messages")
      .update({ reactions: updatedReactions })
      .eq("id", msgId);
  };

  /* ── Filtered messages ── */
  const displayed = search
    ? messages.filter(m => m.text.toLowerCase().includes(search.toLowerCase()))
    : messages;

  return (
    <div style={{ height:"100vh", background:C.bg, color:C.text,
      fontFamily:'"Geist","SF Pro Display",-apple-system,sans-serif',
      display:"flex", overflow:"hidden" }}>

      {/* LEFT sidebar */}
      {(!isMobile || showChannels) && (
        <>
          {isMobile && showChannels && (
            <div onClick={()=>setShowChannels(false)}
              style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:100 }}/>
          )}
          
          <div style={{ 
            width: 224, flexShrink:0, background:C.surface,
            borderRight:`1px solid ${C.border}`,
            display:"flex", flexDirection:"column", overflow:"hidden",
            ...(isMobile ? {
              position:"fixed", top:0, left:0, height:"100vh", zIndex:101
            } : {})
          }}>
            <div style={{ padding:"15px 14px", borderBottom:`1px solid ${C.border}`,
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontWeight:800, fontSize:15 }}>Edurite Chat</span>
              <Settings size={14} color={C.muted} style={{ cursor:"pointer" }}/>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
              <button onClick={()=>setCollapsed(c=>({...c,ch:!c.ch}))} style={{
                display:"flex", alignItems:"center", gap:5, width:"100%",
                padding:"4px 14px", background:"none", border:"none",
                color:C.muted, cursor:"pointer", fontSize:11, fontWeight:700,
                textTransform:"uppercase", letterSpacing:".6px" }}>
                {collapsed.ch ? <ChevronRight size={11}/> : <ChevronDown size={11}/>} Channels
              </button>

              {!collapsed.ch && CHANNELS.map(ch => (
                <button key={ch.id} onClick={()=>switchCh(ch.id)} style={{
                  display:"flex", alignItems:"center", gap:7,
                  width:"100%", padding:"6px 14px", background:"transparent",
                  border:"none", cursor:"pointer",
                  borderLeft: activeCh===ch.id ? `2px solid ${C.accent}` : "2px solid transparent",
                  backgroundColor: activeCh===ch.id ? "rgba(245,158,11,0.08)" : "transparent",
                  color: activeCh===ch.id ? C.accent : C.muted,
                  fontSize:13, fontWeight: activeCh===ch.id ? 600 : 400,
                  transition:"all .1s" }}>
                  <Hash size={13} style={{ flexShrink:0 }}/>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {ch.name}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`,
              display:"flex", alignItems:"center", gap:8 }}>
              <Avatar name={myName} C={C} size={28} fontSize={10} online/>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.accent,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{myName}</p>
                <p style={{ margin:0, fontSize:10, color:C.muted }}>Online</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CENTER */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding: isMobile ? "8px 12px" : "11px 18px", 
          borderBottom:`1px solid ${C.border}`, background:C.surface,
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 6 : 10 }}>
            {isMobile && (
              <button onClick={()=>setShowChannels(s=>!s)} style={{ padding:7,
                borderRadius:8, background:"transparent",
                border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer",
                display:"flex", alignItems:"center" }}>
                <Hash size={16}/>
              </button>
            )}
            {!isMobile && <Hash size={17} color={C.muted}/>}
            <div>
              <p style={{ margin:0, fontSize: isMobile ? 13 : 14, fontWeight:700 }}>{channel?.name}</p>
              {!isMobile && <p style={{ margin:0, fontSize:11, color:C.muted }}>{channel?.desc}</p>}
            </div>
          </div>
          <div style={{ display:"flex", gap: isMobile ? 4 : 8, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6,
              background:C.bg, border:`1px solid ${C.border}`,
              borderRadius:8, padding: isMobile ? "4px 8px" : "5px 10px" }}>
              <Search size={12} color={C.muted}/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search…"
                style={{ background:"none", border:"none", color:C.text,
                  fontSize:12, outline:"none", width: isMobile ? 80 : 110 }}/>
            </div>
            {!isMobile && (
              <button onClick={()=>setShowMembers(s=>!s)} style={{
                padding:"5px 10px", borderRadius:8, cursor:"pointer",
                background: showMembers ? C.accentDim : "transparent",
                border:`1px solid ${showMembers ? C.accent+"44" : C.border}`,
                color: showMembers ? C.accent : C.muted,
                display:"flex", alignItems:"center", gap:5, fontSize:12 }}>
                <Users size={13}/>
                {onlineUsers.length > 0 ? onlineUsers.length : "—"}
              </button>
            )}
          </div>
        </div>

        {/* Pinned */}
        {channel?.pinned && (
          <div style={{ padding: isMobile ? "5px 12px" : "7px 18px", 
            background:C.accentDim, borderBottom:`1px solid ${C.accent}22`,
            display:"flex", alignItems:"center", gap:8 }}>
            <Pin size={11} color={C.accent}/>
            <span style={{ fontSize: isMobile ? 11 : 12, color:C.accent }}>{channel.pinned}</span>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", paddingTop:14, paddingBottom:4 }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"40px 0", color:C.muted }}>
              <Loader size={18} style={{ animation:"spin 1s linear infinite", marginRight:8 }}/> Loading messages…
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
              <p style={{ fontSize:28, margin:"0 0 8px" }}>#</p>
              <p style={{ fontSize:15, fontWeight:700, color:C.secondary, margin:"0 0 4px" }}>
                Welcome to #{channel?.name}!
              </p>
              <p style={{ fontSize:13, margin:0 }}>Be the first to say something.</p>
            </div>
          ) : (
            displayed.map((msg, i) => {
             const prev       = displayed[i-1];
             const showAvatar = !prev || prev.user_id !== msg.user_id ||
             (new Date(msg.created_at) - new Date(prev.created_at)) > 5*60*1000;
            const isMe       = msg.user_id === user?.id;
            return (
            <Message key={msg.id} msg={msg} C={C} user={user}
            isMe={isMe} showAvatar={showAvatar}
            onReact={handleReact}/>
  );
})
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{ padding: isMobile ? "8px 10px" : "12px 16px", 
          borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ background:C.surface2, border:`1px solid ${C.border}`,
            borderRadius:10, position:"relative" }}>
            {showEmoji && (
              <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, zIndex:50,
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
                padding:10, display:"flex", flexWrap:"wrap", gap:3, 
                width: isMobile ? 240 : 272, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={()=>{ setInput(v=>v+e); inputRef.current?.focus(); }}
                    style={{ fontSize:19, background:"none", border:"none",
                      cursor:"pointer", borderRadius:5, padding:"3px 4px" }}>{e}</button>
                ))}
              </div>
            )}

            <div style={{ display:"flex", alignItems:"center", gap:4, padding: isMobile ? "4px 6px" : "6px 8px" }}>
              <button onClick={()=>setShowEmoji(s=>!s)} style={{ padding:6, borderRadius:7,
                background:"none", border:"none",
                color: showEmoji ? C.accent : C.muted, cursor:"pointer",
                display:"flex", alignItems:"center" }}>
                <Smile size={isMobile ? 15 : 17}/>
              </button>
              <input ref={inputRef} value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                placeholder={`Message #${channel?.name}…`}
                style={{ flex:1, background:"none", border:"none", color:C.text,
                  fontSize: isMobile ? 13 : 14, outline:"none", padding:"4px 6px" }}/>
              <button onClick={sendMessage} disabled={!input.trim()||sending} style={{
                padding: isMobile ? "5px 10px" : "6px 14px", borderRadius:8,
                cursor: input.trim()&&!sending ? "pointer" : "not-allowed",
                background: input.trim()&&!sending ? C.accent : "transparent",
                border:"none", color: input.trim()&&!sending ? "#000" : C.muted,
                display:"flex", alignItems:"center", gap:5,
                fontWeight:700, fontSize: isMobile ? 12 : 13, transition:"all .2s" }}>
                {sending
                  ? <Loader size={14} style={{ animation:"spin 1s linear infinite" }}/>
                  : <Send size={isMobile ? 13 : 14}/>}
              </button>
            </div>
          </div>
          {!isMobile && (
            <p style={{ margin:"5px 0 0", fontSize:11, color:C.muted, paddingLeft:2 }}>
              Enter to send · Shift+Enter for new line
            </p>
          )}
        </div>
      </div>

      {/* RIGHT members — hidden on mobile */}
      {showMembers && !isMobile && (
        <div style={{ width:200, flexShrink:0, borderLeft:`1px solid ${C.border}`,
          background:C.surface, overflowY:"auto", padding:"14px 0" }}>
          {onlineUsers.length > 0 ? (
            <>
              <p style={{ margin:"0 0 8px", padding:"0 14px", fontSize:11, fontWeight:700,
                color:C.muted, textTransform:"uppercase", letterSpacing:".6px" }}>
                Online — {onlineUsers.length}
              </p>
              {onlineUsers.map((name, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"5px 14px" }}>
                  <Avatar name={name} C={C} size={28} fontSize={10} online/>
                  <p style={{ margin:0, fontSize:12, fontWeight:600, color:C.text,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</p>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding:"0 14px", color:C.muted, fontSize:12 }}>
              <p style={{ margin:0, fontSize:11, fontWeight:700, textTransform:"uppercase",
                letterSpacing:".6px", marginBottom:8 }}>Members</p>
              <p style={{ margin:0, fontSize:12 }}>No one else online yet</p>
            </div>
          )}
          <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, padding:"12px 14px 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <Avatar name={myName} C={C} size={28} fontSize={10} online/>
              <div>
                <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.accent,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>{myName}</p>
                <p style={{ margin:0, fontSize:10, color:C.muted }}>You</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}