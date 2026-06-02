import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home, Timer, Layers, Target, Users,
  MessageSquare, Trophy, Bot, Star, LogOut,
  Sun, Moon, X
} from "lucide-react";
import { useAuth }    from "../../store/AuthContext";
import { useProfile } from "../../hooks/useProfile";
import { useTheme } from "../../store/ThemeContext";

const NAV = [
  { to: "/dashboard",   Icon: Home,          label: "Dashboard"   },
  { to: "/pomodoro",    Icon: Timer,         label: "Pomodoro"    },
  { to: "/flashcards",  Icon: Layers,        label: "Flashcards"  },
  { to: "/goals",       Icon: Target,        label: "Goals"       },
  { to: "/friends",     Icon: Users,         label: "Friends"     },
  { to: "/chat",        Icon: MessageSquare, label: "Chatroom"    },
  { to: "/leaderboard", Icon: Trophy,        label: "Leaderboard" },
  { to: "/ai-tutor",    Icon: Bot,           label: "AI Tutor"    },
];

export default function Sidebar({ mobileMode = false, onClose }) {
  const [expanded, setExpanded] = useState(true);
  const { signOut }             = useAuth();
  const { initials, displayName, profile } = useProfile();
  const { theme, toggleTheme, colors: C } = useTheme();

  // On mobile, always show expanded
  const showExpanded = mobileMode ? true : expanded;

  return (
    <div style={{
      width: mobileMode ? 260 : expanded ? 220 : 68,
      minWidth: mobileMode ? 260 : expanded ? 220 : 68,
      height: "100vh",
      background: C.surface ?? "#12151F",
      borderRight: `1px solid ${C.border ?? "#1E2235"}`,
      display: "flex", flexDirection: "column",
      transition: mobileMode ? "none" : "width 0.25s ease",
      overflow: "hidden", flexShrink: 0,
    }}>
      {/* Logo — single section with conditional close button */}
      <div style={{
        padding: "20px 14px",
        borderBottom: `1px solid ${C.border ?? "#1E2235"}`,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: C.accent ?? "#F59E0B",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Star size={15} color="#000" fill="#000" />
          </div>
          {showExpanded && (
            <span style={{
              fontWeight: 800, fontSize: 16,
              color: C.text ?? "#E8EAED", whiteSpace: "nowrap",
            }}>
              Edurite
            </span>
          )}
        </div>
        {/* Close button — mobile only */}
        {mobileMode && onClose && (
          <button onClick={onClose} style={{
            background: "none", border: "none",
            color: C.muted ?? "#6B7280", cursor: "pointer",
            display: "flex", padding: 4, borderRadius: 6,
          }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            onClick={mobileMode ? onClose : undefined}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 10px", marginBottom: 2,
              borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap",
              background: isActive 
                ? `${C.accent ?? "#F59E0B"}1F` 
                : "transparent",
              color: isActive 
                ? (C.accent ?? "#F59E0B") 
                : (C.muted ?? "#6B7280"),
              fontWeight: isActive ? 600 : 400,
              fontSize: 14, transition: "all .15s",
            })}>
            <Icon size={18} />
            {showExpanded && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + controls */}
      <div style={{ 
        padding: "10px 8px", 
        borderTop: `1px solid ${C.border ?? "#1E2235"}` 
      }}>
        {/* ✅ Changed outer button to div to avoid nested button error */}
        <div 
          onClick={() => !mobileMode && setExpanded(e => !e)} 
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "8px 10px", borderRadius: 8,
            background: "transparent", 
            cursor: mobileMode ? "default" : "pointer",
          }}
          role="button"
          tabIndex={mobileMode ? -1 : 0}
          onKeyDown={e => {
            if (!mobileMode && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setExpanded(e => !e);
            }
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>
            {initials}
          </div>

          {showExpanded && (
            <>
              <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 13, fontWeight: 600, 
                  color: C.text ?? "#E8EAED",
                  overflow: "hidden", textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                }}>
                  {displayName}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted ?? "#6B7280" }}>
                  {profile?.grade ?? "Student"}
                </p>
              </div>

              {/* ✅ Theme toggle - changed to div with role="button" */}
              <div
                onClick={e => { e.stopPropagation(); toggleTheme(); }}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  background: "none", 
                  color: C.muted ?? "#6B7280",
                  cursor: "pointer", display: "flex", 
                  padding: 4, borderRadius: 6, flexShrink: 0,
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTheme();
                  }
                }}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </div>

              {/* ✅ Sign out - changed to div with role="button" */}
              <div
                onClick={e => { e.stopPropagation(); signOut(); }}
                title="Sign out"
                style={{
                  background: "none", 
                  color: C.muted ?? "#6B7280",
                  cursor: "pointer", display: "flex", 
                  padding: 4, borderRadius: 6, flexShrink: 0,
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    signOut();
                  }
                }}
              >
                <LogOut size={14} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}