// src/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import PendingRequests from "./PendingRequests";
import UsersList from "./UsersList";
import AdminTasks from "./AdminTasks";
import AdminTaskSubmissions from "./AdminTaskSubmissions";

import { Users, DollarSign, LogOut, ArrowLeft } from "lucide-react";
import axios from "axios";

function AdminDashboard({ setIsAdminLoggedIn, setIsAdminView }) {
  const [activeTab, setActiveTab] = useState("requests");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    pendingRequests: 0,
  });

  // load basic stats from backend
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersRes, requestsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/users`, {
            headers: { "x-admin-password": "admin123" },
          }),
          axios.get(`${API_BASE}/api/admin/requests`, {
            headers: { "x-admin-password": "admin123" },
          }),
        ]);

        const users = usersRes.data || [];
        const requests = requestsRes.data || [];

        const totalDepositsSum = users.reduce(
          (sum, u) => sum + (u.totalDeposits || 0),
          0
        );

        setStats({
          totalUsers: users.length,
          totalDeposits: totalDepositsSum,
          pendingRequests: requests.length,
        });
      } catch (err) {
        console.error("Admin stats error:", err);
      }
    };

    loadStats();
  }, []);

  const logout = () => {
    localStorage.removeItem("adminLoggedIn");
    setIsAdminLoggedIn(false);
    setIsAdminView(false);
  };

  return (
    <div className="admin-dashboard">
      {/* HEADER */}
      <div className="admin-header">
        <div className="admin-title">
          <Users size={32} />
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-user-app-btn"
            onClick={() => {
              setIsAdminView(false);
              setIsAdminLoggedIn(false);
            }}
          >
            <ArrowLeft size={20} /> User App
          </button>
          <button className="admin-logout-btn" onClick={logout}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <Users size={24} />
          <div>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <DollarSign size={24} />
          <div>
            <div className="stat-number">
              ₹{stats.totalDeposits.toLocaleString()}
            </div>
            <div className="stat-label">Total Deposits</div>
          </div>
        </div>
        <div className="admin-stat-card warning">
          <DollarSign size={24} />
          <div>
            <div className="stat-number">
              {stats.pendingRequests}
            </div>
            <div className="stat-label">Pending Requests</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${
            activeTab === "requests" ? "active" : ""
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Pending Requests ({stats.pendingRequests})
        </button>

        <button
          className={`admin-tab ${
            activeTab === "users" ? "active" : ""
          }`}
          onClick={() => setActiveTab("users")}
        >
          Users List ({stats.totalUsers})
        </button>

        <button
          className={`admin-tab ${
            activeTab === "tasks" ? "active" : ""
          }`}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </button>

        <button
          className={`admin-tab ${
            activeTab === "taskSubmissions" ? "active" : ""
          }`}
          onClick={() => setActiveTab("taskSubmissions")}
        >
          Task Submissions
        </button>
      </div>

      {/* CONTENT */}
      <div className="admin-content">
        {activeTab === "requests" && (
          <PendingRequests
            onStatsChange={(pendingCount) =>
              setStats((prev) => ({
                ...prev,
                pendingRequests: pendingCount,
              }))
            }
          />
        )}

        {activeTab === "users" && <UsersList />}

        {activeTab === "tasks" && <AdminTasks />}

        {activeTab === "taskSubmissions" && (
          <AdminTaskSubmissions />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
