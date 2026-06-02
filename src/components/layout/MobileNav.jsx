import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Timer, Layers, Target, Users, MessageSquare,
} from "lucide-react";

const NAV = [
  { to: "/dashboard",  Icon: Home,          label: "Home"     },
  { to: "/pomodoro",   Icon: Timer,         label: "Timer"    },
  { to: "/flashcards", Icon: Layers,        label: "Cards"    },
  { to: "/goals",      Icon: Target,        label: "Goals"    },
  { to: "/chat",       Icon: MessageSquare, label: "Chat"     },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      background: "#12151F",
      borderTop: "1px solid #1E2235",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {NAV.map(({ to, Icon, label }) => {
        const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
        return (
          <NavLink
            key={to}
            to={to}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              color: active ? "#F59E0B" : "#6B7280",
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              padding: "4px 8px",
            }}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}