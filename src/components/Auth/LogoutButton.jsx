import { logout } from "../../Services/authService";

function LogoutButton({ onLogout }) {
  const handleLogout = () => {
    logout();
    onLogout();
  };

  return <button onClick={handleLogout}>Logout</button>;
}

export default LogoutButton;