import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import axios from "axios";
import LoaderDots from "../components/LoaderDots";

function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const emptyTask = {
    title: "",
    description: "",
    reward: 0,
    type: "insta_follow",
    targetUrl: "",
    isActive: true,
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/admin/tasks`,
          { headers: { "x-admin-password": "admin123" } }
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
    loadTasks();
  }, []);

  const openNewTask = () => {
    setEditingTask({ ...emptyTask, id: null });
  };

  const openEditTask = (task) => {
    setEditingTask({ ...task });
  };

  const closeForm = () => {
    setEditingTask(null);
  };

  const handleChange = (field, value) => {
    setEditingTask((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveTask = async () => {
    if (!editingTask.title.trim()) {
      alert("Title required");
      return;
    }
    if (!editingTask.reward || editingTask.reward <= 0) {
      alert("Reward must be greater than 0");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: editingTask.title.trim(),
        description: editingTask.description.trim(),
        reward: Number(editingTask.reward),
        type: editingTask.type || "insta_follow",
        targetUrl: editingTask.targetUrl.trim(),
        isActive: !!editingTask.isActive,
      };

      if (editingTask.id) {
        // update
        const res = await axios.patch(
          `${API_BASE}/api/admin/tasks/${editingTask.id}`,
          payload,
          { headers: { "x-admin-password": "admin123" } }
        );
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id ? res.data : t
          )
        );
      } else {
        // create
        const res = await axios.post(
          `${API_BASE}/api/admin/tasks`,
          payload,
          { headers: { "x-admin-password": "admin123" } }
        );
        setTasks((prev) => [res.data, ...prev]);
      }

      closeForm();
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to save task"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task permanently?")) return;

    try {
      await axios.delete(
        `${API_BASE}/api/admin/tasks/${id}`,
        { headers: { "x-admin-password": "admin123" } }
      );
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to delete task"
      );
    }
  };

  return (
    <div className="admin-tasks">
      <div className="admin-tasks-header">
        <h3>Tasks</h3>
        <button className="action-btn primary" onClick={openNewTask}>
          + New Task
        </button>
      </div>

      {loading ? (
        <LoaderDots label="Loading tasks" />
      ) : (
        <div className="tasks-table-admin">
          <div className="task-row-admin task-header-admin">
            <div className="task-cell-admin">Title</div>
            <div className="task-cell-admin">Reward</div>
            <div className="task-cell-admin">Type</div>
            <div className="task-cell-admin">Active</div>
            <div className="task-cell-admin">Actions</div>
          </div>

          {tasks.map((task) => (
            <div key={task.id} className="task-row-admin">
              <div className="task-cell-admin">{task.title}</div>
              <div className="task-cell-admin">
                ₹{(task.reward || 0).toLocaleString()}
              </div>
              <div className="task-cell-admin">{task.type}</div>
              <div className="task-cell-admin">
                {task.isActive ? "Yes" : "No"}
              </div>
              <div className="task-cell-admin">
                <button
                  className="action-btn view"
                  onClick={() => openEditTask(task)}
                >
                  Edit
                </button>
                <button
                  className="action-btn reject"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="no-tasks">No tasks created.</div>
          )}
        </div>
      )}

      {editingTask && (
        <div className="task-modal-overlay">
          <div className="task-modal">
            <h3>{editingTask.id ? "Edit Task" : "New Task"}</h3>

            <div className="task-form">
              <label>Title</label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) =>
                  handleChange("title", e.target.value)
                }
              />

              <label>Description</label>
              <textarea
                rows="4"
                value={editingTask.description}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
                className="reject-textarea"
                placeholder="Explain what user must do to get reward."
              />

              <label>Reward (₹)</label>
              <input
                type="number"
                min="1"
                value={editingTask.reward}
                onChange={(e) =>
                  handleChange("reward", e.target.value)
                }
              />

              <label>Type</label>
              <input
                type="text"
                value={editingTask.type}
                onChange={(e) =>
                  handleChange("type", e.target.value)
                }
                placeholder="insta_follow"
              />

              <label>Target URL (e.g. Instagram link)</label>
              <input
                type="text"
                value={editingTask.targetUrl}
                onChange={(e) =>
                  handleChange("targetUrl", e.target.value)
                }
                placeholder="https://instagram.com/yourpage"
              />

              <label>
                <input
                  type="checkbox"
                  checked={!!editingTask.isActive}
                  onChange={(e) =>
                    handleChange("isActive", e.target.checked)
                  }
                  style={{ marginRight: 6 }}
                />
                Active
              </label>
            </div>

            <div className="task-modal-actions">
              <button
                className="task-start-btn"
                onClick={saveTask}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                className="task-cancel-btn"
                onClick={closeForm}
                disabled={saving}
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

export default AdminTasks;
