import { useState } from "react";
import { login } from "../../Services/authService";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await login(email, password);
      setMessage("Login successful!");
      onLoginSuccess();
    } catch (error) {
      setMessage(error.message || "Login failed");
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: "18px", color: "#111827" }}>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Login
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "14px", color: "#374151", lineHeight: "1.5" }}>
          {message}
        </p>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: "14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  outline: "none",
};

const buttonStyle = {
  width: "100%",
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px",
};

export default Login;