import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { Eye, EyeOff, Star, Loader, AlertCircle, Check } from "lucide-react";
import { supabase } from "../../services/supabase";
const C = {
  bg:"#0B0D14", surface:"#12151F", border:"#1E2235",
  accent:"#F59E0B", accentDim:"rgba(245,158,11,0.12)",
  text:"#E8EAED", muted:"#6B7280", secondary:"#9CA3AF",
  green:"#10B981", greenDim:"rgba(16,185,129,0.12)",
  red:"#EF4444",   redDim:"rgba(239,68,68,0.12)",
};

const FEATURES = [
  { emoji: "⏱️", text: "Pomodoro timer with session tracking"   },
  { emoji: "🃏", text: "AI-powered flashcard generation"         },
  { emoji: "🏆", text: "Leaderboard & friend challenges"         },
  { emoji: "🎯", text: "Goal tracking from dream to daily tasks" },
  { emoji: "💬", text: "Study rooms and group chat"              },
];

function Input({ label, type="text", value, onChange, placeholder, error, right }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display:"block", fontSize:13, fontWeight:600,
          color:C.secondary, marginBottom:6 }}>{label}</label>
      )}
      <div style={{ position:"relative" }}>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder}
          style={{
            width:"100%", boxSizing:"border-box",
            background: C.bg, border:`1px solid ${error ? C.red+"88" : C.border}`,
            borderRadius:9, padding: right ? "11px 44px 11px 14px" : "11px 14px",
            color:C.text, fontSize:14, outline:"none",
            transition:"border-color .2s",
          }}
          onFocus={e  => e.target.style.borderColor = error ? C.red : C.accent}
          onBlur={e   => e.target.style.borderColor = error ? C.red+"88" : C.border}
        />
        {right && (
          <div style={{ position:"absolute", right:12, top:"50%",
            transform:"translateY(-50%)", cursor:"pointer" }}>
            {right}
          </div>
        )}
      </div>
      {error && (
        <p style={{ margin:"5px 0 0", fontSize:12, color:C.red,
          display:"flex", alignItems:"center", gap:4 }}>
          <AlertCircle size={11}/> {error}
        </p>
      )}
    </div>
  );
}

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate           = useNavigate();

  const [mode,      setMode]      = useState("login"); // login | signup
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [grade,     setGrade]     = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  const isLogin = mode === "login";

  /* ── Password strength ── */
  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8)           s++;
    if (/[A-Z]/.test(password))         s++;
    if (/[0-9]/.test(password))         s++;
    if (/[^A-Za-z0-9]/.test(password))  s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", C.red, C.accent, "#84CC16", C.green];

  const validate = () => {
    if (!email.trim())            return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email";
    if (password.length < 6)     return "Password must be at least 6 characters";
    if (!isLogin) {
      if (!name.trim())           return "Full name is required";
      if (password !== confirm)   return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true); setError(""); setSuccess("");
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { data: signUpData, error } = await signUp(email, password, name);
        if (error) throw error;
        if (signUpData?.user) {
       await supabase.from("profiles").upsert({
       id: signUpData.user.id,
       full_name: name.trim(),
       });
}
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      }
    } catch (err) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:'"Geist","SF Pro Display",-apple-system,sans-serif',
      display:"flex",
    }}>

      {/* ── LEFT: Branding panel ── */}
      <div style={{
        flex: 1, display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"60px 64px",
        background:`linear-gradient(135deg, #0B0D14 0%, #0f1520 100%)`,
        borderRight:`1px solid ${C.border}`,
        position:"relative", overflow:"hidden",
      }}>
        {/* Glow */}
        <div style={{ position:"absolute", top:-100, left:-100, width:400, height:400,
          borderRadius:"50%", background:`radial-gradient(circle, ${C.accent}15 0%, transparent 70%)`,
          pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-80, right:-80, width:320, height:320,
          borderRadius:"50%", background:`radial-gradient(circle, #3B82F615 0%, transparent 70%)`,
          pointerEvents:"none" }}/>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:56 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:C.accent,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Star size={20} color="#000" fill="#000"/>
          </div>
          <span style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.5px" }}>Edurite</span>
        </div>

        {/* Headline */}
        <h1 style={{ margin:"0 0 12px", fontSize:38, fontWeight:900,
          letterSpacing:"-1.5px", lineHeight:1.15 }}>
          Study smarter,<br/>
          <span style={{ color:C.accent }}>not harder.</span>
        </h1>
        <p style={{ margin:"0 0 48px", fontSize:16, color:C.secondary, lineHeight:1.6, maxWidth:380 }}>
          Join thousands of students who use Edurite to track goals, ace flashcards, and stay accountable with friends.
        </p>

        {/* Feature list */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {FEATURES.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:C.accentDim,
                border:`1px solid ${C.accent}33`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:15, flexShrink:0 }}>{f.emoji}</div>
              <span style={{ fontSize:13, color:C.secondary }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom testimonial */}
        <div style={{ marginTop:56, padding:"16px 20px", background:C.surface,
          borderRadius:12, border:`1px solid ${C.border}`, maxWidth:400 }}>
          <p style={{ margin:"0 0 8px", fontSize:13, color:C.text, lineHeight:1.6, fontStyle:"italic" }}>
            "Edurite genuinely changed how I prepare for exams. My grades went from 72% to 91% in one semester."
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"#EC4899",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:800, color:"#fff" }}>PS</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth form ── */}
      <div style={{ width:480, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"48px 56px",
        overflowY:"auto" }}>

        <div style={{ width:"100%", maxWidth:380 }}>

          {/* Header */}
          <h2 style={{ margin:"0 0 6px", fontSize:26, fontWeight:900, letterSpacing:"-0.8px" }}>
            {isLogin ? "Welcome back 👋" : "Create your account"}
          </h2>
          <p style={{ margin:"0 0 32px", fontSize:14, color:C.muted }}>
            {isLogin
              ? "Sign in to continue your study streak"
              : "Start your journey to academic excellence"}
          </p>

          {/* Success banner */}
          {success && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:10,
              padding:"12px 14px", borderRadius:10, marginBottom:20,
              background:C.greenDim, border:`1px solid ${C.green}44` }}>
              <Check size={15} color={C.green} style={{ marginTop:1, flexShrink:0 }}/>
              <p style={{ margin:0, fontSize:13, color:C.green }}>{success}</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:10,
              padding:"12px 14px", borderRadius:10, marginBottom:20,
              background:C.redDim, border:`1px solid ${C.red}44` }}>
              <AlertCircle size={15} color={C.red} style={{ marginTop:1, flexShrink:0 }}/>
              <p style={{ margin:0, fontSize:13, color:C.red }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <Input label="Full Name" value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="Arjun Kumar"/>
            )}

            <Input label="Email" type="email" value={email}
              onChange={e=>{ setEmail(e.target.value); setError(""); }}
              placeholder="arjun@example.com"/>

            <Input label="Password" type={showPass?"text":"password"}
              value={password}
              onChange={e=>{ setPassword(e.target.value); setError(""); }}
              placeholder={isLogin ? "Your password" : "Min. 6 characters"}
              right={
                <span onClick={()=>setShowPass(s=>!s)}
                  style={{ color:C.muted, display:"flex", userSelect:"none" }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </span>
              }
            />

            {/* Password strength (signup only) */}
            {!isLogin && password.length > 0 && (
              <div style={{ marginTop:-8, marginBottom:16 }}>
                <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:3, borderRadius:3,
                      background: i<=strength ? strengthColor[strength] : C.border,
                      transition:"background .3s" }}/>
                  ))}
                </div>
                <p style={{ margin:0, fontSize:11, color:strengthColor[strength] }}>
                  {strengthLabel[strength]} password
                </p>
              </div>
            )}

            {!isLogin && (
              <Input label="Confirm Password" type={showPass?"text":"password"}
                value={confirm}
                onChange={e=>{ setConfirm(e.target.value); setError(""); }}
                placeholder="Repeat your password"
                error={confirm && confirm!==password ? "Passwords don't match" : ""}
              />
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width:"100%", padding:"13px", borderRadius:10,
              background: loading ? C.border : C.accent,
              border:"none", color: loading ? C.muted : "#000",
              fontWeight:800, fontSize:15, cursor: loading ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"all .2s", marginTop:4,
              boxShadow: loading ? "none" : `0 4px 20px ${C.accent}44`,
            }}>
              {loading
                ? <><Loader size={16} style={{ animation:"spin 1s linear infinite" }}/> Please wait…</>
                : isLogin ? "Sign In →" : "Create Account →"
              }
            </button>
          </form>

          {/* Toggle */}
          <p style={{ margin:"24px 0 0", textAlign:"center", fontSize:13, color:C.muted }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={()=>{ setMode(isLogin?"signup":"login"); setError(""); setSuccess(""); }}
              style={{ background:"none", border:"none", color:C.accent,
                fontWeight:700, cursor:"pointer", fontSize:13 }}>
              {isLogin ? "Sign up free" : "Sign in"}
            </button>
          </p>

          {/* Terms */}
          {!isLogin && (
            <p style={{ margin:"16px 0 0", textAlign:"center", fontSize:11, color:C.muted, lineHeight:1.6 }}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
