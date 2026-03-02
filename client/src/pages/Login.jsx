import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PhoneIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await axios.get(`${API_BASE}/api/home`, {
        withCredentials: true,
      });
      navigate("/"); // Already logged in
    } catch (err) {}
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/login`,
        { phone, password },
        { withCredentials: true }
      );

      if (res.data.success) {
        navigate("/");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <h1>83LOTTERY</h1>
        <p>Log in</p>
      </div>

      <div className="content">
        <div className="section-title">Phone Login</div>

        <div className="input-group">
          <PhoneIcon className="input-icon" />
          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="input-group password-group">
          <LockClosedIcon className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="eye-icon" />
            ) : (
              <EyeIcon className="eye-icon" />
            )}
          </button>
        </div>

        <button
          className="primary-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <div className="loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            "Log In"
          )}
        </button>

        <button className="forgot-password-btn">Forgot Password?</button>

        <button
          className="outline-btn"
          onClick={() => navigate("/register")}
        >
          Register
        </button>
      </div>

      <div className="page-dots">
        <div className="page-dot active"></div>
        <div className="page-dot"></div>
        <div className="page-dot"></div>
      </div>
    </div>
  );
}

export default Login;
