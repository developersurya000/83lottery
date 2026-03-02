import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import axios from "axios";
import LoaderDots from "../components/LoaderDots";

function AdminTaskSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/admin/task-submissions`,
          { headers: { "x-admin-password": "admin123" } }
        );
        setSubmissions(res.data || []);
      } catch (err) {
        alert(
          err.response?.data?.message ||
            "Failed to load task submissions"
        );
      } finally {
        setLoading(false);
      }
    };
    loadSubmissions();
  }, []);

  const updateSubmission = async (id, status) => {
    try {
      setActingId(id);
      const res = await axios.patch(
        `${API_BASE}/api/admin/task-submissions/${id}`,
        { status },
        { headers: { "x-admin-password": "admin123" } }
      );
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: res.data.status } : s
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          `Failed to ${status} submission`
      );
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="admin-tasks">
      <div className="admin-tasks-header">
        <h3>Task Submissions</h3>
      </div>

      {loading ? (
        <LoaderDots label="Loading submissions" />
      ) : (
        <div className="tasks-table-admin">
          <div className="task-row-admin task-header-admin">
            <div className="task-cell-admin">User</div>
            <div className="task-cell-admin">Task Title</div>
            <div className="task-cell-admin">Insta Username</div>
            <div className="task-cell-admin">Proof</div>
            <div className="task-cell-admin">Status</div>
            <div className="task-cell-admin">Actions</div>
          </div>

          {submissions.map((s) => (
            <div key={s.id} className="task-row-admin">
              <div className="task-cell-admin">
                {s.userPhone}
              </div>
              <div className="task-cell-admin">
                {s.taskTitle}
              </div>
              <div className="task-cell-admin">
                {s.instagramUsername}
              </div>
              <div className="task-cell-admin">
                {s.proofUrl ? (
                  <a
                    href={s.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="task-link"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </div>
              <div className="task-cell-admin">
                <span
                  className={`status-badge ${s.status}`}
                >
                  {s.status.toUpperCase()}
                </span>
              </div>
              <div className="task-cell-admin">
                {s.status === "pending" ? (
                  <>
                    <button
                      className="action-btn approve"
                      disabled={actingId === s.id}
                      onClick={() =>
                        updateSubmission(s.id, "approved")
                      }
                    >
                      {actingId === s.id
                        ? "Approving..."
                        : "Approve"}
                    </button>
                    <button
                      className="action-btn reject"
                      disabled={actingId === s.id}
                      onClick={() =>
                        updateSubmission(s.id, "rejected")
                      }
                    >
                      {actingId === s.id
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </>
                ) : (
                  "-"
                )}
              </div>
            </div>
          ))}

          {submissions.length === 0 && (
            <div className="no-tasks">
              No submissions yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminTaskSubmissions;
