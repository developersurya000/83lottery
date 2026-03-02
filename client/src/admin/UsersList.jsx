// src/admin/UsersList.jsx
import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import axios from "axios";
import LoaderDots from "../components/LoaderDots";

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/admin/users`,
          { headers: { "x-admin-password": "admin123" } }
        );
        setUsers(res.data || []);
      } catch (err) {
        alert(
          err.response?.data?.message || "Failed to load users"
        );
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  return (
    <div className="users-list">
      <h3>All Users ({users.length})</h3>

      {loading ? (
        <LoaderDots label="Loading users" />
      ) : (
        <div className="users-table">
          <div className="user-row user-header">
            <div className="user-cell">Phone</div>
            <div className="user-cell">Name</div>
            <div className="user-cell">Balance</div>
            <div className="user-cell">Bonus</div>
            <div className="user-cell">Total Deposits</div>
            <div className="user-cell">Actions</div>
          </div>

          {users.map((user) => (
            <div key={user.id} className="user-row">
              <div className="user-cell">{user.phone}</div>
              <div className="user-cell">{user.name}</div>
              <div className="user-cell balance">
                ₹{(user.balance || 0).toLocaleString()}
              </div>
              <div className="user-cell">
                ₹{(user.bonus || 0).toFixed(2)}
              </div>
              <div className="user-cell">
                ₹{(user.totalDeposits || 0).toLocaleString()}
              </div>
              <div className="user-actions">
                <button className="action-btn view">
                  View
                </button>
                <button className="action-btn edit">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UsersList;
