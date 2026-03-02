import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import axios from "axios";
import LoaderDots from "../components/LoaderDots";

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [instaUsername, setInstaUsername] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // helper to load tasks (used on mount and after submit)
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/tasks`,
        { withCredentials: true }
      );
      setTasks(res.data || []);
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openTask = (task) => {
    setSelectedTask(task);
    setInstaUsername("");
    setProofUrl("");
  };

  const closeTask = () => {
    setSelectedTask(null);
    setInstaUsername("");
    setProofUrl("");
  };

  const submitTask = async () => {
    if (!instaUsername.trim() || !proofUrl.trim()) {
      alert("Enter Instagram username and proof URL");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_BASE}/api/tasks/${selectedTask.id}/submit`,
        {
          instagramUsername: instaUsername.trim(),
          proofUrl: proofUrl.trim(),
        },
        { withCredentials: true }
      );
      alert(
        "Submitted! Admin will verify and credit your reward."
      );
      closeTask();

      // reload tasks so this task shows status = pending
      await fetchTasks();
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to submit task"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tasks-page">
      <h2>Tasks & Rewards</h2>
      <p>Complete tasks to earn extra money.</p>

      {loading ? (
        <LoaderDots label="Loading tasks" />
      ) : (
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-main">
                <h3>{task.title}</h3>
                <p className="task-reward">
                  Reward: ₹{task.reward}
                </p>
              </div>

              {/* status / button */}
              {task.status === "approved" ? (
                <span className="task-status success">Success</span>
              ) : task.status === "pending" ? (
                <span className="task-status pending">Pending</span>
              ) : task.status === "rejected" ? (
                <span className="task-status rejected">Rejected</span>
              ) : (
                <button
                  className="task-go-btn"
                  onClick={() => openTask(task)}
                >
                  Go
                </button>
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="no-tasks">
              No tasks available now.
            </div>
          )}
        </div>
      )}

      {selectedTask && (
        <div className="task-modal-overlay">
          <div className="task-modal">
            <h3>{selectedTask.title}</h3>
            <p className="task-desc">
              {selectedTask.description}
            </p>

            {selectedTask.targetUrl && (
              <a
                href={selectedTask.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="task-link"
              >
                Open Instagram
              </a>
            )}

            <div className="task-form">
              <label>Instagram Username</label>
              <input
                type="text"
                value={instaUsername}
                onChange={(e) => setInstaUsername(e.target.value)}
                placeholder="your_instagram_username"
              />

              <label>Proof Screenshot URL</label>
              <input
                type="text"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="Paste screenshot image link"
              />
            </div>

            <div className="task-modal-actions">
              <button
                className="task-start-btn"
                onClick={submitTask}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Task"}
              </button>
              <button
                className="task-cancel-btn"
                onClick={closeTask}
                disabled={submitting}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
