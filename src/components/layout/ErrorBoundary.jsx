import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { crashed: false, error: null };

  static getDerivedStateFromError(error) {
    return { crashed: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (!this.state.crashed) return this.props.children;

    return (
      <div style={{
        height: "100vh", background: "#0B0D14", color: "#E8EAED",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        fontFamily: '"Geist","SF Pro Display",-apple-system,sans-serif',
        padding: 40, textAlign: "center",
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6B7280", maxWidth: 400 }}>
          {this.state.error?.message ?? "An unexpected error occurred."}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={() => this.setState({ crashed: false, error: null })}
            style={{
              padding: "10px 20px", borderRadius: 9, cursor: "pointer",
              background: "transparent", border: "1px solid #1E2235",
              color: "#9CA3AF", fontWeight: 600, fontSize: 14,
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/dashboard"}
            style={{
              padding: "10px 20px", borderRadius: 9, cursor: "pointer",
              background: "#F59E0B", border: "none",
              color: "#000", fontWeight: 800, fontSize: 14,
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
}