import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider }  from "./store/AuthContext";
import { ThemeProvider } from "./store/ThemeContext";  // ← ADD THIS
import App from "./App";
import ErrorBoundary from "./components/layout/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>     {/* ← add */}
          <App />
        </ErrorBoundary>    {/* ← add */}
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);