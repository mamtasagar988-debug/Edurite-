import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, X, ChevronLeft, Sparkles, Edit2, Trash2,
  RotateCcw, Brain, Shuffle, Loader, Check,
  ChevronRight, Star, Zap, AlertCircle, BookOpen,
  Layers, ArrowRight, RefreshCw, Globe, Lock,
} from "lucide-react";
import { useTheme } from "../../store/ThemeContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useFlashcards } from "../../hooks/useFlashcards";

/* ─── Emoji palette for deck creation ───────────────────────────── */
const EMOJIS = ["📐","🌍","⚛️","🧪","📚","🎯","💡","🔬","🧠","📊","🗺️","✏️","🧬","🎵","💻","🏛️"];

/* ─── Rating definitions ─────────────────────────────────────────── */
const RATINGS = [
  { key: "hard", label: "Hard", icon: "😰", color: "#F97316", bg: "#F9731618" },
  { key: "good", label: "Good", icon: "👍", color: "#22C55E", bg: "#22C55E18" },
  { key: "easy", label: "Easy", icon: "⭐", color: "#3B82F6", bg: "#3B82F618" },
];

/* ─── Hardcoded sample decks (fallback when no data) ─────────────── */
const SAMPLE_DECKS = [
  {
    id: "sample-1", name: "Calculus", emoji: "📐", color: "#F59E0B", is_public: false,
    cards: [
      { id: "s1c1", front: "What is a derivative?",   back: "The instantaneous rate of change of f(x).\n\nd/dx f(x) = lim(h→0) [f(x+h) − f(x)] / h", rating: null  },
      { id: "s1c2", front: "Chain Rule formula?",     back: "If y = f(g(x)), then:\n\ndy/dx = f ′(g(x)) · g ′(x)",                                   rating: "good" },
      { id: "s1c3", front: "∫ sin(x) dx = ?",         back: "−cos(x) + C",                                                                            rating: "easy" },
      { id: "s1c4", front: "Product Rule formula?",   back: "(f · g)′ = f ′ · g + f · g ′",                                                            rating: null  },
      { id: "s1c5", front: "What is a limit?",        back: "The value f(x) approaches as x → c.\n\nWritten: lim(x→c) f(x) = L",                      rating: "hard" },
    ],
  },
  {
    id: "sample-2", name: "World History", emoji: "🌍", color: "#3B82F6", is_public: false,
    cards: [
      { id: "s2c1", front: "When did WW2 end?",           back: "1945 — V-E Day (May 8, Germany) &\nV-J Day (Sep 2, Japan)",                           rating: "easy" },
      { id: "s2c2", front: "Causes of WW1 (acronym)?",   back: "MAIN:\n• Militarism\n• Alliance systems\n• Imperialism\n• Nationalism",                rating: "good" },
      { id: "s2c3", front: "French Revolution dates?",    back: "1789–1799\nEnded with Napoleon's coup on 18 Brumaire",                                rating: null  },
    ],
  },
  {
    id: "sample-3", name: "Physics", emoji: "⚛️", color: "#10B981", is_public: false,
    cards: [
      { id: "s3c1", front: "Newton's 2nd Law?",       back: "F = ma\n(Force = mass × acceleration)",                                                   rating: "easy" },
      { id: "s3c2", front: "Ohm's Law?",              back: "V = IR\n(Voltage = Current × Resistance)",                                                rating: "good" },
      { id: "s3c3", front: "Speed of light?",         back: "c ≈ 3 × 10⁸ m/s in vacuum",                                                              rating: null  },
      { id: "s3c4", front: "What is entropy?",        back: "Measure of disorder in a system.\n2nd Law: entropy never decreases in an isolated system.", rating: "hard" },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────── */
function deckStats(deck) {
  const cards  = deck.cards || [];
  const total  = cards.length;
  const easy   = cards.filter(c => c.rating === "easy").length;
  const good   = cards.filter(c => c.rating === "good").length;
  const hard   = cards.filter(c => c.rating === "hard").length;
  const unseen = cards.filter(c => !c.rating).length;
  const mastery = total > 0
    ? Math.round(((easy * 1 + good * 0.6) / total) * 100) : 0;
  return { total, easy, good, hard, unseen, mastery, due: hard + unseen };
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/* ─── Mini progress ring ─────────────────────────────────────────── */
function MiniRing({ pct, color, size = 54, stroke = 4 }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset .6s ease" }}
      />
    </svg>
  );
}

/* ─── Community deck card ─────────────────────────────────────────── */
function CommunityDeckCard({ deck, C, isMobile, onCopy }) {
  return (
    <div style={{ 
      background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, padding: isMobile ? "14px" : "18px"
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div style={{ 
          width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 10,
          background: (deck.color || C.accent) + "18",
          border: `1px solid ${(deck.color || C.accent)}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isMobile ? 18 : 22,
        }}>
          {deck.emoji || "📚"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin:0, fontSize: isMobile ? 14 : 15, fontWeight:700, 
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {deck.name}
          </p>
          <p style={{ margin:0, fontSize:12, color:C.muted }}>
            by {deck.profiles?.full_name ?? "Community"} · {(deck.cards || []).length} cards
          </p>
        </div>
      </div>
      <button onClick={()=>onCopy(deck)} style={{
        width:"100%", padding: isMobile ? "7px" : "9px", borderRadius:8, cursor:"pointer",
        background:C.accentDim, border:`1px solid ${C.accent}44`,
        color:C.accent, fontWeight:700, fontSize: isMobile ? 12 : 13,
        display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
        <Plus size={14}/> Copy to my decks
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VIEW 1 — DECK LIBRARY
═══════════════════════════════════════════════════════════════════ */
function DeckLibrary({ 
  decks, C, isMobile, onStudy, onEdit, onNewDeck, onAI, onDelete, 
  onTogglePublic, onCopy, communityDecks, communityLoading, onSearchCommunity 
}) {
  const searchTimeoutRef = useRef(null);
  const [libTab, setLibTab] = useState("mine");
  const [communitySearch, setCommunitySearch] = useState("");
  
  const totalCards    = decks.reduce((a, d) => a + (d.cards?.length || 0), 0);
  const totalMastered = decks.reduce((a, d) => a + (d.cards?.filter(c => c.rating === "easy").length || 0), 0);
  const handleSearch = (q) => {
    setCommunitySearch(q);
    // Debounce the search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onSearchCommunity?.(q);
    }, 300);
  };
  const card = (extra = {}) => ({
    background: C.surface, borderRadius: 12,
    border: `1px solid ${C.border}`, padding: "20px", ...extra,
  });

  

  return (
    <div style={{ padding: isMobile ? "16px" : "28px", flex: 1, overflowY: "auto" }}>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:4, marginBottom:18,
        background:C.surface, borderRadius:9, padding:3,
        border:`1px solid ${C.border}`, width:"fit-content" }}>
        {[
          { key: "mine", label: "My Decks" },
          { key: "community", label: "🌍 Community" },
        ].map(t => (
          <button key={t.key} onClick={()=>setLibTab(t.key)} style={{
            padding: isMobile ? "5px 12px" : "6px 18px", borderRadius:7, cursor:"pointer",
            background: libTab===t.key ? C.bg : "transparent",
            border: libTab===t.key ? `1px solid ${C.border}` : "1px solid transparent",
            color: libTab===t.key ? C.text : C.muted,
            fontSize: isMobile ? 12 : 13, fontWeight: libTab===t.key?600:400,
            textTransform:"capitalize", transition:"all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MY DECKS TAB ── */}
      {libTab === "mine" && (
        <>
          {/* Summary bar */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
            gap: isMobile ? 8 : 12, 
            marginBottom: isMobile ? 20 : 28 
          }}>
            {[
              { label: "Total Decks",    value: decks.length,   emoji: "📚", color: C.accent },
              { label: "Total Cards",    value: totalCards,      emoji: "🃏", color: C.blue   },
              { label: "Cards Mastered", value: totalMastered,   emoji: "⭐", color: C.green  },
            ].map(s => (
              <div key={s.label} style={{ ...card({ padding: isMobile ? "12px" : "16px" }), display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
                <span style={{ fontSize: isMobile ? 22 : 28 }}>{s.emoji}</span>
                <div>
                  <p style={{ margin: 0, fontSize: isMobile ? 18 : 24, fontWeight: 800, color: s.color, letterSpacing: "-1px" }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 14 : 18, flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? 8 : 0 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 700 }}>Your Decks</h2>
            <div style={{ display: "flex", gap: isMobile ? 4 : 8 }}>
              <button onClick={onAI} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: isMobile ? "6px 10px" : "8px 16px", borderRadius: 8, cursor: "pointer",
                background: C.purpleDim, border: `1px solid ${C.purple}44`,
                color: C.purple, fontSize: isMobile ? 11 : 13, fontWeight: 600,
              }}>
                <Sparkles size={isMobile ? 12 : 14} /> AI Generate
              </button>
              <button onClick={onNewDeck} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: isMobile ? "6px 10px" : "8px 16px", borderRadius: 8, cursor: "pointer",
                background: C.accentDim, border: `1px solid ${C.accent}44`,
                color: C.accent, fontSize: isMobile ? 11 : 13, fontWeight: 600,
              }}>
                <Plus size={isMobile ? 12 : 14} /> New Deck
              </button>
            </div>
          </div>

          {/* Deck grid */}
          {decks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>📚</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.secondary, margin: "0 0 4px" }}>No decks yet</p>
              <p style={{ fontSize: 13, margin: "0 0 20px" }}>Create your first deck or explore the Community tab</p>
              <button onClick={onNewDeck} style={{
                padding:"10px 24px", borderRadius:9, cursor:"pointer",
                background:C.accent, border:"none", color:"#000", fontWeight:700, fontSize:13,
              }}>Create a deck →</button>
            </div>
          ) : (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
              gap: isMobile ? 12 : 16 
            }}>
              {decks.map(deck => {
                const stats = deckStats(deck);
                return (
                  <div key={deck.id} style={{
                    ...card({ padding: isMobile ? "16px" : "20px" }),
                    cursor: "default",
                    transition: "border-color .2s",
                    position: "relative",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = (deck.color || C.accent) + "66"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 10,
                          background: (deck.color || C.accent) + "18",
                          border: `1px solid ${(deck.color || C.accent)}33`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: isMobile ? 18 : 22,
                        }}>
                          {deck.emoji}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: isMobile ? 14 : 15, fontWeight: 700 }}>{deck.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{stats.total} cards · {stats.due} due</p>
                        </div>
                      </div>
                      {stats.total > 0 && (
                        <div style={{ position: "relative", width: 54, height: 54 }}>
                          <MiniRing pct={stats.mastery} color={deck.color || C.accent} />
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700, color: deck.color || C.accent,
                          }}>
                            {stats.mastery}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card breakdown */}
                    {stats.total > 0 && (
                      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                        {[
                          { label: "Easy",   count: stats.easy,   color: C.blue   },
                          { label: "Good",   count: stats.good,   color: C.green  },
                          { label: "Hard",   count: stats.hard,   color: C.orange },
                          { label: "Unseen", count: stats.unseen, color: C.muted  },
                        ].map(b => (
                          <div key={b.label} style={{
                            flex: 1, textAlign: "center",
                            padding: "5px 4px", borderRadius: 6,
                            background: C.bg, border: `1px solid ${C.border}`,
                          }}>
                            <p style={{ margin: 0, fontSize: isMobile ? 12 : 14, fontWeight: 700, color: b.color }}>{b.count}</p>
                            <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{b.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: isMobile ? 4 : 8 }}>
                      <button onClick={() => onStudy(deck)} disabled={stats.total === 0} style={{
                        flex: 1, padding: isMobile ? "7px" : "9px", borderRadius: 8, cursor: stats.total > 0 ? "pointer" : "not-allowed",
                        background: stats.total > 0 ? (deck.color || C.accent) : C.border, border: "none",
                        color: stats.total > 0 ? "#000" : C.muted, fontWeight: 700, fontSize: isMobile ? 11 : 13,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        opacity: stats.total > 0 ? 1 : 0.5,
                      }}>
                        <Brain size={isMobile ? 12 : 14} /> Study
                      </button>
                      <button onClick={() => onEdit(deck)} style={{
                        padding: isMobile ? "7px 10px" : "9px 12px", borderRadius: 8, cursor: "pointer",
                        background: "transparent", border: `1px solid ${C.border}`,
                        color: C.muted, display: "flex", alignItems: "center",
                      }}>
                        <Edit2 size={isMobile ? 12 : 14} />
                      </button>
                      {/* Public/Private toggle */}
                      <button onClick={(e) => { e.stopPropagation(); onTogglePublic(deck.id); }} style={{
                        padding: isMobile ? "5px 8px" : "9px 12px", borderRadius: 8, cursor: "pointer",
                        background: deck.is_public ? C.greenDim : "transparent",
                        border: `1px solid ${deck.is_public ? C.green+"44" : C.border}`,
                        color: deck.is_public ? C.green : C.muted,
                        fontSize: isMobile ? 10 : 12, fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                      }}>
                        {deck.is_public ? <><Globe size={isMobile ? 10 : 12}/> Public</> : <><Lock size={isMobile ? 10 : 12}/> Private</>}
                      </button>
                      <button onClick={() => onDelete(deck.id)} style={{
                        padding: isMobile ? "7px 10px" : "9px 12px", borderRadius: 8, cursor: "pointer",
                        background: "transparent", border: `1px solid ${C.border}`,
                        color: C.muted, display: "flex", alignItems: "center",
                      }}>
                        <Trash2 size={isMobile ? 12 : 14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── COMMUNITY TAB ── */}
      {libTab === "community" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 9, padding: "8px 14px", marginBottom: 18, maxWidth: 400 }}>
            <span style={{ fontSize: 13, color: C.muted }}>🔍</span>
            <input value={communitySearch} onChange={e => handleSearch(e.target.value)}
              placeholder="Search public decks…"
              style={{ background: "none", border: "none", color: C.text,
                fontSize: 13, outline: "none", flex: 1 }}/>
          </div>

          {communityLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }}/>
            </div>
          ) : !communityDecks || communityDecks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
              <p style={{ fontSize: 28, margin: "0 0 8px" }}>🌍</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.secondary, margin: "0 0 4px" }}>
                {communitySearch ? `No public decks match "${communitySearch}"` : "No public decks found"}
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>
                Make your decks public to share with the community!
              </p>
            </div>
          ) : (
            <div style={{ 
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
              gap: isMobile ? 12 : 16 
            }}>
              {communityDecks.map(deck => (
                <CommunityDeckCard key={deck.id} deck={deck} C={C} isMobile={isMobile} onCopy={onCopy}/>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VIEW 2 — STUDY SESSION
═══════════════════════════════════════════════════════════════════ */
function StudySession({ deck, C, isMobile, onBack, onUpdateRatings }) {
  const cards = deck.cards || [];
  const [queue,       setQueue]       = useState(() => shuffle(cards));
  const [index,       setIndex]       = useState(0);
  const [flipped,     setFlipped]     = useState(false);
  const [sessionLog,  setSessionLog]  = useState([]);
  const [done,        setDone]        = useState(false);

  const current    = queue[index];
  const progress   = queue.length > 0 ? index / queue.length : 0;
  const remaining  = queue.length - index;

  if (queue.length === 0) {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:28, gap:16 }}>
        <p style={{ fontSize:28 }}>📭</p>
        <p style={{ fontSize:16, fontWeight:700 }}>This deck has no cards yet</p>
        <p style={{ fontSize:13, color: C.muted }}>Add some cards first then come back to study</p>
        <button onClick={onBack} style={{
          padding:"10px 24px", borderRadius:9, cursor:"pointer",
          background: C.accent, border:"none",
          color:"#000", fontWeight:700, fontSize:13,
        }}>← Back to decks</button>
      </div>
    );
  }

  const rate = useCallback((ratingKey) => {
    const log = [...sessionLog, { cardId: current.id, rating: ratingKey }];
    setSessionLog(log);
    onUpdateRatings(deck.id, log);

    const next = index + 1;
    if (next >= queue.length) {
      setDone(true);
    } else {
      setFlipped(false);
      setTimeout(() => setIndex(next), 100);
    }
  }, [index, queue, current, sessionLog, deck.id, onUpdateRatings]);

  const restart = () => {
    setQueue(shuffle(cards));
    setIndex(0); setFlipped(false);
    setSessionLog([]); setDone(false);
  };

  if (done) {
    const counts = RATINGS.reduce((acc, r) => {
      acc[r.key] = sessionLog.filter(l => l.rating === r.key).length;
      return acc;
    }, {});
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? 16 : 28, gap: isMobile ? 16 : 24 }}>
        <div style={{ fontSize: isMobile ? 40 : 60 }}>🎉</div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: isMobile ? 20 : 24, fontWeight: 800 }}>Session Complete!</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: isMobile ? 12 : 14 }}>You reviewed {queue.length} cards from {deck.name}</p>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 8 : 12, flexWrap: "wrap", justifyContent: "center" }}>
          {RATINGS.map(r => (
            <div key={r.key} style={{ 
              padding: isMobile ? "10px 14px" : "14px 20px", 
              background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, textAlign: "center", minWidth: isMobile ? 60 : 70 
            }}>
              <p style={{ margin: "0 0 4px", fontSize: isMobile ? 18 : 22, fontWeight: 800, color: r.color }}>{counts[r.key] || 0}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{r.label}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
          <button onClick={restart} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "12px 24px", borderRadius: 10, cursor: "pointer",
            background: C.accentDim, border: `1px solid ${C.accent}44`,
            color: C.accent, fontWeight: 700, fontSize: 14, justifyContent: "center",
          }}><RefreshCw size={15} /> Study Again</button>
          <button onClick={onBack} style={{
            padding: "12px 24px", borderRadius: 10, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.border}`,
            color: C.muted, fontWeight: 600, fontSize: 14, textAlign: "center",
          }}>Back to Decks</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: C.border }}>
        <div style={{ height: "100%", background: deck.color || C.accent,
          width: `${progress * 100}%`, transition: "width .4s ease" }}/>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "16px 20px" : "28px 40px", gap: isMobile ? 20 : 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: C.muted }}>Card {index + 1} of {queue.length}</span>
          <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: (deck.color || C.accent) + "18", color: deck.color || C.accent, fontWeight: 600 }}>{remaining} remaining</span>
        </div>

        <div onClick={() => setFlipped(f => !f)}
          style={{ perspective: "1200px", width: "100%", maxWidth: isMobile ? "100%" : 560, cursor: "pointer" }}>
          <div style={{
            position: "relative", height: isMobile ? 240 : 280,
            transformStyle: "preserve-3d",
            transition: "transform .55s cubic-bezier(.4,0,.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}>
            {/* Front */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              background: C.surface, border: `1px solid ${(deck.color || C.accent)}33`, borderRadius: 16,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: isMobile ? "20px" : "32px", boxShadow: `0 8px 40px ${(deck.color || C.accent)}18`,
            }}>
              <p style={{ margin: "0 0 16px", fontSize: 11, color: deck.color || C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>Question</p>
              <p style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 700, textAlign: "center", lineHeight: 1.5, color: C.text }}>{current.front}</p>
              <p style={{ margin: "24px 0 0", fontSize: 12, color: C.muted }}>Tap to reveal answer</p>
            </div>
            {/* Back */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)", background: (deck.color || C.accent) + "0C",
              border: `1px solid ${(deck.color || C.accent)}55`, borderRadius: 16,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: isMobile ? "20px" : "32px", boxShadow: `0 8px 40px ${(deck.color || C.accent)}25`,
            }}>
              <p style={{ margin: "0 0 16px", fontSize: 11, color: deck.color || C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>Answer</p>
              <p style={{ margin: 0, fontSize: isMobile ? 15 : 17, textAlign: "center", lineHeight: 1.7, color: C.text, whiteSpace: "pre-line" }}>{current.back}</p>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex", gap: isMobile ? 6 : 10, flexWrap: "wrap", justifyContent: "center",
          opacity: flipped ? 1 : 0, transform: flipped ? "translateY(0)" : "translateY(12px)",
          transition: "opacity .3s, transform .3s", pointerEvents: flipped ? "auto" : "none",
        }}>
          {RATINGS.map(r => (
            <button key={r.key} onClick={() => rate(r.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: isMobile ? "10px 14px" : "12px 20px", borderRadius: 12, cursor: "pointer",
              background: r.bg, border: `1px solid ${r.color}44`,
              color: r.color, transition: "transform .15s, box-shadow .15s", minWidth: isMobile ? 70 : 80,
            }}>
              <span style={{ fontSize: isMobile ? 16 : 18 }}>{r.icon}</span>
              <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700 }}>{r.label}</span>
            </button>
          ))}
        </div>
        {!flipped && <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Rate how well you knew the card after revealing it</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VIEW 3 — DECK EDITOR
═══════════════════════════════════════════════════════════════════ */
function DeckEditor({ deck, C, isMobile, onSave, onBack }) {
  const isNew = !deck;
  const [name,      setName]      = useState(deck?.name  ?? "");
  const [emoji,     setEmoji]     = useState(deck?.emoji ?? "📚");
  const [color,     setColor]     = useState(deck?.color ?? C.accent);
  const [cards,     setCards]     = useState(deck?.cards ?? []);
  const [editId,    setEditId]    = useState(null);
  const [front,     setFront]     = useState("");
  const [back,      setBack]      = useState("");

  const COLORS = [C.accent, C.blue, C.green, C.purple, "#EC4899", C.red];

  const startEdit = (c = null) => {
    setEditId(c ? c.id : "new");
    setFront(c?.front ?? "");
    setBack(c?.back ?? "");
  };

  const saveCard = () => {
    if (!front.trim() || !back.trim()) return;
    if (editId === "new") {
      setCards(cs => [...cs, { id: Date.now(), front: front.trim(), back: back.trim(), rating: null }]);
    } else {
      setCards(cs => cs.map(c => c.id === editId ? { ...c, front: front.trim(), back: back.trim() } : c));
    }
    setEditId(null); setFront(""); setBack("");
  };

  const deleteCard = (id) => setCards(cs => cs.filter(c => c.id !== id));

  const handleSave = () => {
    if (!name.trim()) return;
    const cleanedCards = cards.map(c => ({
      id: c.id,
      front: c.front?.trim() || "",
      back: c.back?.trim() || "",
      rating: c.rating || null,
    }));
    onSave({ 
      id: deck?.id ?? Date.now(), 
      name: name.trim(), 
      emoji, 
      color, 
      cards: cleanedCards 
    });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 28 }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 22px", fontSize: isMobile ? 16 : 18, fontWeight: 800 }}>
          {isNew ? "Create New Deck" : `Edit — ${deck.name}`}
        </h2>

        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? "16px" : "20px", marginBottom: 18 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: ".6px" }}>Deck Info</p>
          
          <p style={{ margin: "0 0 8px", fontSize: 13, color: C.secondary }}>Icon</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{
                width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 8, fontSize: isMobile ? 16 : 18, cursor: "pointer",
                background: emoji === e ? C.accentDim : C.bg,
                border: `1px solid ${emoji === e ? C.accent : C.border}`,
              }}>{e}</button>
            ))}
          </div>

          <p style={{ margin: "0 0 8px", fontSize: 13, color: C.secondary }}>Color</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {COLORS.map(col => (
              <button key={col} onClick={() => setColor(col)} style={{
                width: 28, height: 28, borderRadius: "50%", background: col, cursor: "pointer",
                border: `3px solid ${color === col ? C.text : "transparent"}`,
              }}/>
            ))}
          </div>

          <p style={{ margin: "0 0 8px", fontSize: 13, color: C.secondary }}>Deck Name</p>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Calculus, World History…"
            style={{ width: "100%", boxSizing: "border-box", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, outline: "none" }}/>
        </div>

        {/* Card editor panel */}
        {editId !== null && (
          <div style={{ padding: isMobile ? "16px" : "20px", borderRadius: 12, border: `1px solid ${color}44`, marginBottom: 18, background: color + "08" }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color }}>{editId === "new" ? "Add Card" : "Edit Card"}</p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              {[
                { label: "Front (Question)", val: front, set: setFront },
                { label: "Back (Answer)",   val: back,  set: setBack  },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: C.muted }}>{f.label}</p>
                  <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={4} placeholder={f.label}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}/>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={saveCard} style={{ padding: "9px 20px", borderRadius: 8, cursor: "pointer", background: color, border: "none", color: "#000", fontWeight: 700, fontSize: 13 }}>{editId === "new" ? "Add Card" : "Save Changes"}</button>
              <button onClick={() => setEditId(null)} style={{ padding: "9px 16px", borderRadius: 8, cursor: "pointer", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Card list */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? "16px" : "20px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Cards ({cards.length})</p>
            <button onClick={() => startEdit(null)} style={{ display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "5px 10px" : "7px 14px", borderRadius: 8, cursor: "pointer", background: C.accentDim, border: `1px solid ${C.accent}44`, color: C.accent, fontSize: 13, fontWeight: 600 }}><Plus size={13}/> Add Card</button>
          </div>
          {cards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.muted }}><p style={{ margin: "0 0 6px", fontSize: 28 }}>🃏</p><p style={{ margin: 0, fontSize: 13 }}>No cards yet — add your first one above</p></div>
          ) : (
            cards.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.muted, paddingTop: 2, minWidth: 18 }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: C.text }}>{c.front}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.back}</p>
                </div>
                <button onClick={() => startEdit(c)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><Edit2 size={13}/></button>
                <button onClick={() => deleteCard(c.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><Trash2 size={13}/></button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
          <button onClick={onBack} style={{ padding: "11px 20px", borderRadius: 10, cursor: "pointer", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} style={{ flex: isMobile ? "none" : 1, padding: "11px", borderRadius: 10, cursor: name.trim() ? "pointer" : "not-allowed", background: name.trim() ? color : C.border, border: "none", color: "#000", fontWeight: 800, fontSize: 14, opacity: name.trim() ? 1 : 0.5 }}>{isNew ? "Create Deck" : "Save Deck"}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VIEW 4 — AI GENERATOR
═══════════════════════════════════════════════════════════════════ */
function AIGenerator({ decks, C, isMobile, onBack, onAddCards }) {
  const [topic, setTopic] = useState(""), [notes, setNotes] = useState(""), [count, setCount] = useState(8);
  const [targetDeck, setTargetDeck] = useState(decks[0]?.id ?? null);
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [generated, setGenerated] = useState(null), [selected, setSelected] = useState([]);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(""); setGenerated(null); setSelected([]);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key not found. Add VITE_GROQ_API_KEY to your .env file.");
      }

      const prompt = `Generate exactly ${count} educational flashcards about: "${topic}".${notes ? `\n\nUse these notes as context:\n${notes}` : ""}

Return ONLY a valid JSON array. Each object must have "front" and "back" keys with string values. Escape any quotes inside strings with backslash.
Example: [{"front":"What is X?","back":"X is a concept that..."}]`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.3, // Lower temperature = more consistent JSON
          response_format: { type: "json_object" }, // Force JSON output
        }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${res.status}`);
      }
      
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      // Robust JSON extraction
      let cards;
      try {
        // Try parsing the raw text first
        cards = JSON.parse(text);
        // If it's an object with a key containing the array, extract it
        if (!Array.isArray(cards)) {
          cards = cards.cards || cards.flashcards || cards.data || cards.questions || [];
        }
      } catch {
        // Try extracting JSON array from text
        const clean = text.replace(/```json|```/g, "").trim();
        const jsonMatch = clean.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            cards = JSON.parse(jsonMatch[0]);
          } catch {
            // Try fixing common JSON issues
            const fixed = jsonMatch[0]
              .replace(/(?<!\\)"/g, '"')   // Fix unescaped quotes
              .replace(/[\n\r]/g, ' ')     // Remove newlines in strings
              .replace(/,\s*]/g, ']');     // Remove trailing commas
            cards = JSON.parse(fixed);
          }
        }
      }
      
      if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error("Could not parse flashcards from response");
      }
      
      // Ensure each card has front and back
      cards = cards.map(c => ({
        front: c.front || c.question || "Question",
        back: c.back || c.answer || "Answer"
      }));
      
      setGenerated(cards); 
      setSelected(cards.map((_, i) => i));
    } catch (e) {
      console.error("Generation error:", e);
      setError(e.message || "Failed to generate cards. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const toggleSelect = (i) => setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 28 }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.purpleDim, border: `1px solid ${C.purple}44`, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={18} color={C.purple}/></div>
          <div><h2 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 800 }}>AI Card Generator</h2><p style={{ margin: 0, fontSize: 12, color: C.muted }}>Powered by Groq</p></div>
        </div>

        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? "16px" : "20px", marginBottom: 18 }}>
          <div style={{ marginBottom: 16 }}><p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Topic *</p><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis, French Revolution…" style={{ width: "100%", boxSizing: "border-box", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, outline: "none" }}/></div>
          <div style={{ marginBottom: 16 }}><p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Paste notes <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></p><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="Paste your class notes…" style={{ width: "100%", boxSizing: "border-box", resize: "vertical", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }}/></div>
          
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Number of cards</p><span style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>{count}</span></div><input type="range" min={3} max={20} step={1} value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: "100%", accentColor: C.purple }}/></div>
            <div><p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Add to deck</p><select value={targetDeck} onChange={e => setTargetDeck(e.target.value)} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none" }}>{decks.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}</select></div>
          </div>

          <button onClick={generate} disabled={!topic.trim() || loading} style={{ width: "100%", padding: "12px", borderRadius: 10, cursor: topic.trim() && !loading ? "pointer" : "not-allowed", background: topic.trim() && !loading ? C.purple : C.border, border: "none", color: topic.trim() && !loading ? "#fff" : C.muted, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{loading ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }}/> Generating…</> : <><Sparkles size={16}/> Generate {count} Cards</>}</button>
        </div>

        {error && (<div style={{ padding: "14px 16px", background: C.redDim, borderRadius: 12, border: `1px solid ${C.red}44`, marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}><AlertCircle size={16} color={C.red}/><p style={{ margin: 0, fontSize: 13, color: C.red }}>{error}</p></div>)}

        {generated && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{generated.length} cards generated<span style={{ color: C.muted, fontWeight: 400 }}> · {selected.length} selected</span></p>
            <button onClick={() => selected.length === generated.length ? setSelected([]) : setSelected(generated.map((_, i) => i))} style={{ background: "none", border: "none", color: C.purple, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{selected.length === generated.length ? "Deselect all" : "Select all"}</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            {generated.map((c, i) => {
              const sel = selected.includes(i);
              return (
                <div key={i} onClick={() => toggleSelect(i)} style={{ padding: "14px 16px", background: sel ? C.purpleDim : C.surface, borderRadius: 12, border: `1px solid ${sel ? C.purple + "55" : C.border}`, cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: sel ? C.purple : "transparent", border: `1.5px solid ${sel ? C.purple : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{sel && <Check size={12} color="#fff" strokeWidth={3}/>}</div>
                  <div><p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.text }}>{c.front}</p><p style={{ margin: 0, fontSize: 12, color: C.secondary, lineHeight: 1.5 }}>{c.back}</p></div>
                </div>
              );
            })}
          </div>
          <button onClick={() => { onAddCards(targetDeck, generated.filter((_, i) => selected.includes(i))); onBack(); }} disabled={selected.length === 0} style={{ width: "100%", padding: "13px", borderRadius: 10, cursor: selected.length > 0 ? "pointer" : "not-allowed", background: selected.length > 0 ? C.purple : C.border, border: "none", color: selected.length > 0 ? "#fff" : C.muted, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><BookOpen size={15}/>Add {selected.length} cards</button>
        </>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function FlashCards() {
  const { colors: C } = useTheme();
  const isMobile = useIsMobile();
  
  const {
    decks: hookDecks, loading: decksLoading, saveDeck, deleteDeck,
    togglePublic, rateCard, copyDeck, loadCommunityDecks,
  } = useFlashcards();
  
  // Use hook decks if available, otherwise fall back to samples
  const decks = hookDecks?.length > 0 ? hookDecks : SAMPLE_DECKS;
  
  const [view,        setView]        = useState("decks");
  const [activeDeck,  setActiveDeck]  = useState(null);
  const [communityDecks, setCommunityDecks] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  const handleStudy = (deck)  => { setActiveDeck(deck); setView("study");  };
  const handleEdit  = (deck)  => { setActiveDeck(deck); setView("editor"); };
  const handleNew   = ()      => { setActiveDeck(null); setView("editor"); };
  const handleAI    = ()      => {                       setView("ai");     };
  const handleBack  = ()      => {                       setView("decks");  };

  const handleDelete = async (id) => {
    if (typeof id === "string" && id.startsWith("sample-")) return; // Can't delete samples
    await deleteDeck(id);
  };

  const handleSaveDeck = async (saved) => {
    try {
      await saveDeck(saved);
      setView("decks");
    } catch (err) {
      console.error("Failed to save deck:", err);
    }
  };

  const handleUpdateRatings = useCallback(async (deckId, log) => {
    if (typeof deckId === "string" && deckId.startsWith("sample-")) return; // Samples are read-only
    try {
      for (const entry of log) {
        await rateCard(deckId, entry.cardId, entry.rating);
      }
    } catch (err) {
      console.error("Failed to rate card:", err);
    }
  }, [rateCard]);

  const handleAddAICards = async (deckId, newCards) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    const updatedCards = [...(deck.cards || []), ...newCards.map((c, i) => ({
      id: Date.now() + i, ...c, rating: null,
    }))];
    await saveDeck({ ...deck, cards: updatedCards });
  };

  const handleTogglePublic = async (deckId) => {
    if (typeof deckId === "string" && deckId.startsWith("sample-")) return;
    await togglePublic(deckId);
  };

  const handleSearchCommunity = async (q) => {
    setCommunityLoading(true);
    try {
      console.log("Searching community for:", q); // Debug log
      const results = await loadCommunityDecks(q || undefined);
      console.log("Community results:", results); // Debug log
      setCommunityDecks(results || []);
    } catch (err) {
      console.error("Failed to load community decks:", err);
      setCommunityDecks([]);
    }
    setCommunityLoading(false);
  };

  const handleCopyDeck = async (deck) => {
    try {
      await copyDeck(deck);
    } catch (err) {
      console.error("Failed to copy deck:", err);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: '"Geist","SF Pro Display",-apple-system,sans-serif',
      display: "flex", flexDirection: "column",
    }}>
      <header style={{
        padding: isMobile ? "14px 16px" : "18px 28px",
        borderBottom: `1px solid ${C.border}`, background: C.surface,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {view !== "decks" && (
            <button onClick={handleBack} style={{
              padding: "6px 12px", borderRadius: 8, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 5,
            }}><ChevronLeft size={14}/> Back</button>
          )}
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".8px" }}>Flashcards</p>
            <h1 style={{ margin: "2px 0 0", fontSize: isMobile ? 18 : 20, fontWeight: 800, letterSpacing: "-0.4px" }}>
              {view === "decks"  && "Your Decks 🃏"}
              {view === "study"  && `Studying: ${activeDeck?.name} ${activeDeck?.emoji}`}
              {view === "editor" && (activeDeck ? `Editing: ${activeDeck.name}` : "New Deck")}
              {view === "ai"     && "AI Generator ✨"}
            </h1>
          </div>
        </div>
      </header>

      {view === "decks" && (
        <DeckLibrary
          decks={decks}
          C={C} isMobile={isMobile}
          onStudy={handleStudy} onEdit={handleEdit}
          onNewDeck={handleNew} onAI={handleAI}
          onDelete={handleDelete} onTogglePublic={handleTogglePublic}
          onCopy={handleCopyDeck}
          communityDecks={communityDecks}
          communityLoading={communityLoading}
          onSearchCommunity={handleSearchCommunity}
        />
      )}
      {view === "study" && activeDeck && (
        <StudySession
          deck={activeDeck} C={C} isMobile={isMobile}
          onBack={handleBack} onUpdateRatings={handleUpdateRatings}
        />
      )}
      {view === "editor" && (
        <DeckEditor
          deck={activeDeck} C={C} isMobile={isMobile}
          onSave={handleSaveDeck} onBack={handleBack}
        />
      )}
      {view === "ai" && (
        <AIGenerator
          decks={decks} C={C} isMobile={isMobile}
          onBack={handleBack} onAddCards={handleAddAICards}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}