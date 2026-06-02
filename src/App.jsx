import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout      from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Login          from "./features/auth/Login";
import ProfileSetup   from "./features/auth/ProfileSetup";
import Dashboard      from "./features/dashboard/Dashboard";
import PomodoroTimer  from "./features/pomodoro/PomodoroTimer";
import FlashCards     from "./features/flashcards/FlashCards";
import Leaderboard    from "./features/leaderboard/Leaderboard";
import Goals          from "./features/goals/Goals";
import Friends        from "./features/friends/Friends";
import Chatroom       from "./features/chat/Chatroom";

export default function App() {
  return (
    <Routes>

      {/* ── Public ── */}
      <Route path="/login" element={<Login />} />

      {/* ── Setup (protected but no sidebar) ── */}
      <Route path="/setup" element={
        <ProtectedRoute>
          <ProfileSetup />
        </ProtectedRoute>
      } />

      {/* ── Protected + sidebar layout ── */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/"            element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/pomodoro"    element={<PomodoroTimer />} />
        <Route path="/flashcards"  element={<FlashCards />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/goals"       element={<Goals />} />
        <Route path="/friends"     element={<Friends />} />
        <Route path="/chat"        element={<Chatroom />} />
        <Route path="/ai-tutor"    element={<div style={{color:"#E8EAED",padding:40}}>AI Tutor — coming soon</div>} />
      </Route>

    </Routes>
  );
}