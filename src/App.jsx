import { useState } from "react";
import Signup from "./components/Auth/Signup";
import ConfirmSignup from "./components/Auth/ConfirmSignup";
import Login from "./components/Auth/Login";
import UploadMedicine from "./components/Upload/UploadMedicine";
import { isAuthenticated, logout } from "./services/authService";
import AdminDashboard from "./components/Admin/AdminDashboard";

function App() {
  const [page, setPage] = useState("signup");
  const [signupEmail, setSignupEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const ADMIN_EMAIL = "arula8244@gmail.com";

  const handleSignupSuccess = (email) => {
    setSignupEmail(email);
    setPage("confirm");
  };

  const handleConfirmSuccess = () => {
    setPage("login");
  };

  const handleLoginSuccess = () => {
    setLoggedIn(true);
  };

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setPage("login");
  };
if (loggedIn) {
  const currentUser = localStorage.getItem("userEmail");

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
          color: "white",
          padding: "18px 20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "28px" }}>
              MediTrack Cloud
            </h1>
            <p style={{ margin: "6px 0 0 0", fontSize: "14px", opacity: 0.95 }}>
              {currentUser === ADMIN_EMAIL
                ? "Admin Control Panel"
                : "Smart Medicine Expiry Tracker Dashboard"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: "white",
              color: "#1d4ed8",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {currentUser === ADMIN_EMAIL ? <AdminDashboard /> : <UploadMedicine />}
    </div>
  );
}

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h1 style={{ marginBottom: "8px", color: "#111827" }}>MediTrack Cloud</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Secure login for your medicine tracker
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setPage("signup")}
            style={{
              background: page === "signup" ? "#2563eb" : "#e5e7eb",
              color: page === "signup" ? "white" : "#111827",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Signup
          </button>

          <button
            onClick={() => setPage("login")}
            style={{
              background: page === "login" ? "#2563eb" : "#e5e7eb",
              color: page === "login" ? "white" : "#111827",
              border: "none",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Login
          </button>
        </div>

        {page === "signup" && <Signup onSignupSuccess={handleSignupSuccess} />}

        {page === "confirm" && (
          <ConfirmSignup
            email={signupEmail}
            onConfirmSuccess={handleConfirmSuccess}
          />
        )}

        {page === "login" && <Login onLoginSuccess={handleLoginSuccess} />}
      </div>
    </div>
  );
}

export default App;