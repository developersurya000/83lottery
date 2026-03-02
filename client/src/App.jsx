// App.jsx
import { useState, useEffect } from "react";
import { API_BASE } from "./api";
import { useSearchParams, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import DepositPage from "./pages/DepositPage";
import WithdrawPage from "./pages/WithdrawPage";
import HistoryPage from "./pages/HistoryPage";
import SupportPage from "./pages/SupportPage";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import BottomNav from "./components/BottomNav";
import TasksPage from "./pages/TasksPage";
import "./style.css";
import "./App.css";
import axios from "axios";
import { useState as useReactState } from "react";

function App() {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState("home");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: "Player",
    phone: "",
    balance: 0,
    bonus: 0,
    hasDeposited: false,
    wageringReq: 0,
    firstWithdraw: true,
    upiId: "",
  });
  const navigate = useNavigate();

  const isAdminUrl = searchParams.get("admin") === "1";

  const loadUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/user`, {
        withCredentials: true,
      });
      setUser((prev) => ({
        ...prev,
        ...res.data,
      }));
    } catch (err) {
      navigate("/login");
    }
  };

  // restore admin login from localStorage (admin "token")
  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") === "true") {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // load user when not in admin URL
  useEffect(() => {
    if (!isAdminUrl) {
      loadUser();
    }
  }, [isAdminUrl]);

  // ADMIN MODE (/?admin=1)
  if (isAdminUrl) {
    return (
      <div className="admin-app-container">
        {isAdminLoggedIn ? (
          <AdminDashboard
            setIsAdminLoggedIn={setIsAdminLoggedIn}
          />
        ) : (
          <AdminLogin setIsAdminLoggedIn={setIsAdminLoggedIn} />
        )}
      </div>
    );
  }

  // USER MODE
  return (
    <div className="app-container">
      <div className="main-content">
        {currentPage === "home" && (
          <Home user={user} setUser={setUser} />
        )}

        {currentPage === "tasks" && <TasksPage />}

        {currentPage === "wallet" && (
          <WalletSection
            user={user}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === "account" && (
          <AccountSection
            user={user}
            setUser={setUser}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === "deposit" && (
          <DepositPage
            user={user}
            setUser={setUser}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === "withdraw" && (
          <WithdrawPage
            user={user}
            setUser={setUser}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === "history" && (
          <HistoryPage user={user} />
        )}

        {currentPage === "support" && (
          <SupportPage user={user} />
        )}
      </div>

      <BottomNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}

function WalletSection({ user, setCurrentPage }) {
  return (
    <div className="wallet-page">
      <div className="wallet-card">
        <h3>My Wallet</h3>
        <div className="wallet-balance-large">
          ₹{user.balance.toLocaleString()}
        </div>
        <div className="wallet-info">
          <div className="wallet-row">
            <span>Available</span>
            <span>₹{user.balance.toLocaleString()}</span>
          </div>
          <div className="wallet-row bonus">
            <span>Bonus</span>
            <span>₹{(user.bonus || 0).toFixed(2)}</span>
          </div>
        </div>
        <div className="wallet-actions-full">
          <button
            className="wallet-btn primary full-width"
            onClick={() => setCurrentPage("deposit")}
          >
            + Deposit
          </button>
          <button
            className="wallet-btn secondary full-width"
            onClick={() => setCurrentPage("withdraw")}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountSection({ user, setUser, setCurrentPage }) {
  const [editName, setEditName] = useReactState(false);
  const [name, setName] = useReactState(user.name || "Player");
  const [saving, setSaving] = useReactState(false);
  const navigate = useNavigate();

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(user.name || "Player");
      setEditName(false);
      return;
    }
    try {
      setSaving(true);
      const res = await axios.post(
        `${API_BASE}/api/user/name`,
        { name: trimmed },
        { withCredentials: true }
      );
      setUser((prev) => ({ ...prev, name: res.data.name }));
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to save name"
      );
      setName(user.name || "Player");
    } finally {
      setSaving(false);
      setEditName(false);
    }
  };

  const handleNameEdit = () => {
    if (editName) {
      saveName();
    } else {
      setEditName(true);
    }
  };

  // USER LOGOUT: delete user token & redirect to /login
  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/logout`,
        {},
        { withCredentials: true }
      );
    } catch (e) {
      // ignore
    }
    setUser({
      name: "Player",
      phone: "",
      balance: 0,
      bonus: 0,
      hasDeposited: false,
      wageringReq: 0,
      firstWithdraw: true,
      upiId: "",
    });
    setCurrentPage("home");
    navigate("/login");
  };

  return (
    <div className="account-page">
      <div className="profile-card">
        <div className="avatar">👤</div>
        {editName ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            className="name-input"
            autoFocus
            placeholder="Enter name"
            disabled={saving}
          />
        ) : (
          <h2
            className="name-display"
            onClick={handleNameEdit}
          >
            {user.name || "Player"}
          </h2>
        )}
        <div className="profile-info">
          <div className="info-row">
            <span>Phone:</span>
            <span>{user.phone}</span>
          </div>
          <div className="info-row highlight">
            <span>Balance:</span>
            <span>₹{user.balance.toLocaleString()}</span>
          </div>
          {user.upiId && (
            <div className="info-row">
              <span>UPI ID:</span>
              <span>{user.upiId}</span>
            </div>
          )}
          <div className="info-row">
            <span>Wagering Left:</span>
            <span>₹{user.wageringReq || 0}</span>
          </div>
        </div>
      </div>
      <div className="actions-grid">
        <button
          className="action-btn deposit"
          onClick={() => setCurrentPage("wallet")}
        >
          💰 Deposit
        </button>
        <button
          className="action-btn withdraw"
          onClick={() => setCurrentPage("wallet")}
        >
          💸 Withdraw
        </button>
        <button
          className="action-btn history"
          onClick={() => setCurrentPage("history")}
        >
          📋 History
        </button>
        <button
          className="action-btn support"
          onClick={() => setCurrentPage("support")}
        >
          💬 Support
        </button>
        <button
          className="action-btn logout"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default App;
