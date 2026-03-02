import { useState } from "react";
import { Shield, LogIn } from "lucide-react";

function AdminLogin({ setIsAdminLoggedIn }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === "admin123") {
        localStorage.setItem("adminLoggedIn", "true");
        setIsAdminLoggedIn(true);
      } else {
        alert("Wrong password!");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-logo">
          <Shield size={60} />
          <h2>Admin Panel</h2>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="input-group">
            <label>Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="admin-input"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : (
              <>
                <LogIn size={20} /> Login
              </>
            )}
          </button>
        </form>

        <div className="admin-hint">
          Demo: <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
