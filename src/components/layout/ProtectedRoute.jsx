import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth }    from "../../store/AuthContext";
import { supabase }   from "../../services/supabase";
import { Star }       from "lucide-react";

function Spinner() {
  return (
    <div style={{
      height:"100vh", background:"#0B0D14",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16,
      fontFamily:'"Geist","SF Pro Display",-apple-system,sans-serif',
    }}>
      <div style={{ width:40, height:40, borderRadius:10, background:"#F59E0B",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Star size={20} color="#000" fill="#000"/>
      </div>
      <p style={{ color:"#6B7280", fontSize:14, margin:0 }}>Loading StudyFlow…</p>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [profileLoading, setProfileLoading] = useState(true);
  const [needsSetup,     setNeedsSetup]     = useState(false);
  const [userName, setUserName] = useState(
  user?.user_metadata?.full_name ?? ""
);

  useEffect(() => {
    if (!user) { setProfileLoading(false); return; }

    supabase
      .from("profiles")
      .select("grade")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        // If grade is null/empty → first time user, needs setup
        setNeedsSetup(!data?.grade);
        setProfileLoading(false);
      });
  }, [user]);

  if (authLoading || profileLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  /* New user — redirect to setup unless already there */
  if (needsSetup && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }

  return children;
}
