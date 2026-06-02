import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth }    from "../../store/AuthContext";
import { supabase }   from "../../services/supabase";
import { Star, Loader, ChevronRight } from "lucide-react";

const C = {
  bg:"#0B0D14", surface:"#12151F", border:"#1E2235",
  accent:"#F59E0B", accentDim:"rgba(245,158,11,0.12)",
  text:"#E8EAED", muted:"#6B7280", secondary:"#9CA3AF",
  green:"#10B981", red:"#EF4444",
};
const GRADES = [
  "Grade 8", "Grade 9", "Grade 10",
  "Grade 11", "Grade 12", "College / University", "Other",
];

const STREAMS = [
  { label:"Science",     emoji:"🔬" },
  { label:"Commerce",    emoji:"📊" },
  { label:"Arts",        emoji:"🎨" },
  { label:"Engineering", emoji:"⚙️" },
  { label:"Medical",     emoji:"⚕️" },
  { label:"Law",         emoji:"⚖️" },
  { label:"Other",       emoji:"📚" },
];

export default function ProfileSetup() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [userName, setUserName] = useState(   // ← ADD THIS
    user?.user_metadata?.full_name ?? ""
  );
  const [step,  setStep]  = useState(1);
   // 1 = grade, 2 = stream
  const [grade,   setGrade]   = useState("");
  const [stream,  setStream]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  
  const handleFinish = async () => {
  if (!grade || !stream) return;
  setSaving(true);
  setError("");

  const { error } = await supabase
    .from("profiles")
    .update({
      grade,
      subject: stream,
      full_name: userName.trim() || user?.user_metadata?.full_name || user?.email,
    })
    .eq("id", user.id);
  
  if (error) { setError("Something went wrong."); setSaving(false); return; }
  navigate("/dashboard");
};


  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: '"Geist","SF Pro Display",-apple-system,sans-serif',
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:40 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Star size={17} color="#000" fill="#000"/>
          </div>
          <span style={{ fontWeight:800, fontSize:18, letterSpacing:"-0.4px" }}>StudyFlow</span>
        </div>

        {/* Step indicator */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:32 }}>
          {[1,2].map(s => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{
                width:28, height:28, borderRadius:"50%",
                background: step >= s ? C.accent : C.border,
                color: step >= s ? "#000" : C.muted,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:800, transition:"all .3s",
              }}>{s}</div>
              {s < 2 && <div style={{ width:40, height:2,
                background: step > s ? C.accent : C.border, transition:"all .3s" }}/>}
            </div>
          ))}
          <span style={{ marginLeft:8, fontSize:12, color:C.muted }}>
            Step {step} of 2
          </span>
        </div>





        {/* STEP 1 — Grade */}
        {step === 1 && (
  <>
           <h1 style={{ margin:"0 0 8px", fontSize:28, fontWeight:900, letterSpacing:"-1px" }}>
            Welcome! 👋
           </h1>
           <p style={{ margin:"0 0 20px", fontSize:15, color:C.secondary }}>
           Let's set up your profile.
           </p>
            <p style={{ margin:"0 0 8px", fontSize:13, fontWeight:600 }}>Your Name</p>
    <input
      value={userName}
      onChange={e => setUserName(e.target.value)}
      placeholder="e.g. Arjun Kumar"
      style={{
        width:"100%", boxSizing:"border-box", marginBottom:20,
        background:"#0B0D14", border:"1px solid #1E2235",
        borderRadius:9, padding:"11px 14px",
        color:"#E8EAED", fontSize:14, outline:"none",
      }}
    />

    <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:600 }}>
      What grade are you in?
    </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
              {GRADES.map(g => (
                <button key={g} onClick={() => setGrade(g)} style={{
                  padding:"13px 16px", borderRadius:10, cursor:"pointer",
                  textAlign:"left", fontSize:14, fontWeight:600,
                  background: grade === g ? C.accentDim : C.surface,
                  border:`1px solid ${grade === g ? C.accent+"66" : C.border}`,
                  color: grade === g ? C.accent : C.text,
                  transition:"all .15s",
                }}>
                  {g}
                </button>
              ))}
            </div>

            <button onClick={() => grade && setStep(2)} disabled={!grade} style={{
              width:"100%", padding:"13px", borderRadius:10,
              background: grade ? C.accent : C.border,
              border:"none", color: grade ? "#000" : C.muted,
              fontWeight:800, fontSize:15, cursor: grade ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"all .2s",
              boxShadow: grade ? `0 4px 20px ${C.accent}44` : "none",
            }}>
              Continue <ChevronRight size={17}/>
            </button>
          </>
        )}

        {/* STEP 2 — Stream */}
        {step === 2 && (
          <>
            <h1 style={{ margin:"0 0 8px", fontSize:28, fontWeight:900, letterSpacing:"-1px" }}>
              What's your stream? 📚
            </h1>
            <p style={{ margin:"0 0 28px", fontSize:15, color:C.secondary, lineHeight:1.6 }}>
              We'll tailor your study channels and suggestions.
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
              {STREAMS.map(s => (
                <button key={s.label} onClick={() => setStream(s.label)} style={{
                  padding:"14px 16px", borderRadius:10, cursor:"pointer",
                  textAlign:"left", fontSize:14, fontWeight:600,
                  background: stream === s.label ? C.accentDim : C.surface,
                  border:`1px solid ${stream === s.label ? C.accent+"66" : C.border}`,
                  color: stream === s.label ? C.accent : C.text,
                  transition:"all .15s",
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{ fontSize:20 }}>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>

            {error && (
              <p style={{ color:C.red, fontSize:13, marginBottom:12 }}>{error}</p>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(1)} style={{
                padding:"13px 20px", borderRadius:10, cursor:"pointer",
                background:"transparent", border:`1px solid ${C.border}`,
                color:C.muted, fontWeight:600, fontSize:14,
              }}>Back</button>

              <button onClick={handleFinish} disabled={!stream || saving} style={{
                flex:1, padding:"13px", borderRadius:10,
                background: stream && !saving ? C.accent : C.border,
                border:"none", color: stream && !saving ? "#000" : C.muted,
                fontWeight:800, fontSize:15,
                cursor: stream && !saving ? "pointer" : "not-allowed",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                transition:"all .2s",
                boxShadow: stream && !saving ? `0 4px 20px ${C.accent}44` : "none",
              }}>
                {saving
                  ? <><Loader size={16} style={{ animation:"spin 1s linear infinite" }}/> Saving…</>
                  : <>Let's go! 🚀</>}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
