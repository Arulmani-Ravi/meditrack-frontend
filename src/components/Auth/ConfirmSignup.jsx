import { useState } from "react";
import { confirmSignUp } from "../../Services/authService";

function ConfirmSignup({ email, onConfirmSuccess }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleConfirm = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await confirmSignUp(email, code);
      setMessage("Account confirmed successfully! You can login now.");
      onConfirmSuccess();
    } catch (error) {
      setMessage(error.message || "Confirmation failed");
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: "10px", color: "#111827" }}>Verify Account</h2>
      <p style={{ color: "#6b7280", marginBottom: "18px" }}>
        Verification code sent to: <strong>{email}</strong>
      </p>

      <form onSubmit={handleConfirm}>
        <input
          type="text"
          placeholder="Enter verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Confirm Account
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

export default ConfirmSignup;