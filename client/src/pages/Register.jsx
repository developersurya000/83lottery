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

function Register() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      navigate("/");
    } catch (err) {}
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/register`, {
        phone,
        password,
      });

      alert(res.data.message); // includes 30 bonus text
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <h2>83LOTTERY</h2>
        <p>Register</p>
      </div>

      <div className="content">
        <div className="section-title">Create Account</div>

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
            placeholder="Set Password"
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

        <div className="input-group password-group">
          <LockClosedIcon className="input-icon" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="eye-icon" />
            ) : (
              <EyeIcon className="eye-icon" />
            )}
          </button>
        </div>

        <button
          className="primary-btn"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <div className="loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            "Register"
          )}
        </button>

        <button className="outline-btn" onClick={() => navigate("/login")}>
          Log In
        </button>
      </div>

      <div className="page-dots">
        <div className="page-dot"></div>
        <div className="page-dot active"></div>
        <div className="page-dot"></div>
      </div>
    </div>
  );
}

export default Register;
