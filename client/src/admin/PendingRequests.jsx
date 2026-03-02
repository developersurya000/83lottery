// src/admin/PendingRequests.jsx
import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import axios from "axios";
import LoaderDots from "../components/LoaderDots";

function PendingRequests({ onStatsChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [rejectForm, setRejectForm] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/admin/requests`,
          { headers: { "x-admin-password": "admin123" } }
        );
        setRequests(res.data || []);
        onStatsChange?.((res.data || []).length);
      } catch (err) {
        alert(
          err.response?.data?.message || "Failed to load requests"
        );
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [onStatsChange]);

  const updateStatus = async (id, status, reason) => {
    try {
      setLoadingId(id);
      await axios.patch(
        `${API_BASE}/api/admin/transaction/${id}`,
        { status, rejectReason: reason || "" },
        { headers: { "x-admin-password": "admin123" } }
      );

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status } : r
        )
      );

      const pendingCount = requests.filter(
        (r) => r.id !== id && r.status === "pending"
      ).length;
      onStatsChange?.(pendingCount);
      alert(`Transaction ${status}`);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          `Failed to ${status} transaction`
      );
    } finally {
      setLoadingId(null);
    }
  };

  const approveRequest = (id) => updateStatus(id, "approved");
  const openRejectForm = (id) => {
    setRejectForm(id);
    setRejectReason("");
  };
  const closeRejectForm = () => {
    setRejectForm(null);
    setRejectReason("");
  };
  const submitReject = () => {
    if (!rejectReason.trim()) {
      alert("Enter rejection reason");
      return;
    }
    updateStatus(rejectForm, "rejected", rejectReason);
    closeRejectForm();
  };

  return (
    <div className="pending-requests">
      <h3>
        Pending Requests (
        {requests.filter((r) => r.status === "pending").length})
      </h3>

      {loading ? (
        <LoaderDots label="Loading requests" />
      ) : (
        <div className="requests-table">
          <div className="request-row request-header">
            <div className="request-cell">User Phone</div>
            <div className="request-cell">Type</div>
            <div className="request-cell">Amount</div>
            <div className="request-cell">UTR / UPI</div>
            <div className="request-cell">Date</div>
            <div className="request-cell">Actions / Status</div>
          </div>

          {requests.map((request) => (
            <div
              key={request.id}
              className={`request-row ${request.status}`}
            >
              <div className="request-cell">
                {request.userPhone}
              </div>
              <div className="request-cell">
                {request.type?.toUpperCase()}
              </div>
              <div className="request-cell">
                ₹{request.amount?.toLocaleString()}
              </div>
              <div className="request-cell">
                {request.utr || request.upi || "-"}
              </div>
              <div className="request-cell">
                {request.createdAt || ""}
              </div>

              <div className="request-actions">
                {request.status === "pending" ? (
                  <>
                    <button
                      className={`action-btn approve ${
                        loadingId === request.id
                          ? "loading"
                          : ""
                      }`}
                      onClick={() =>
                        approveRequest(request.id)
                      }
                      disabled={loadingId === request.id}
                    >
                      {loadingId === request.id ? (
                        <span className="btn-loader">
                          <span className="spinner" /> Processing...
                        </span>
                      ) : (
                        "✅ Approve"
                      )}
                    </button>
                    <button
                      className={`action-btn reject ${
                        loadingId === request.id
                          ? "loading"
                          : ""
                      }`}
                      onClick={() =>
                        openRejectForm(request.id)
                      }
                      disabled={loadingId === request.id}
                    >
                      {loadingId === request.id ? (
                        <span className="btn-loader">
                          <span className="spinner" /> Please wait...
                        </span>
                      ) : (
                        "❌ Reject"
                      )}
                    </button>
                  </>
                ) : (
                  <span
                    className={`status-badge ${request.status}`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectForm && (
        <div className="reject-modal-overlay">
          <div className="reject-modal">
            <h4>Reject Request</h4>
            <p>Enter reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(e.target.value)
              }
              placeholder="Enter rejection reason..."
              rows="4"
              className="reject-textarea"
            />
            <div className="modal-actions">
              <button
                className="action-btn reject"
                onClick={submitReject}
              >
                Submit Reject
              </button>
              <button
                className="action-btn cancel"
                onClick={closeRejectForm}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingRequests;
