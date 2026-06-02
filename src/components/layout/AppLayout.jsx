import { Outlet, useLocation } from "react-router-dom";
import Sidebar    from "./Sidebar";
import MobileNav from "./MobileNav";
import { useStreak }   from "../../hooks/useStreak";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useTheme }    from "../../store/ThemeContext";

export default function AppLayout() {
  useStreak();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { colors: C } = useTheme();

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      height: "100vh",
      overflow: "hidden",
      background: C.bg,
    }}>
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Page content */}
      <div style={{
        flex: 1,
        overflow: "auto",
        /* On mobile leave room for bottom nav */
        paddingBottom: isMobile ? 64 : 0,
      }}>
        <div
          key={location.pathname}
          style={{ animation: "pageIn .25s ease", minHeight: "100%" }}
        >
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <MobileNav />}

      <style>{`
        @keyframes pageIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </div>
  );
}
