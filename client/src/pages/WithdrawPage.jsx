import { useState } from "react";
import { API_BASE } from "../api";
import "../App.css";
import axios from "axios";

function WithdrawPage({ user, setUser, setCurrentPage }) {
  const [upiId, setUpiId] = useState(user.upiId || "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);

    if (!upiId || !amt || amt < 100 || amt > user.balance) {
      alert(
        "Enter valid UPI ID and amount (₹100 - ₹" + user.balance + ")"
      );
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/api/withdraw`,
        { amount: amt, upiId },
        { withCredentials: true }
      );
      alert(res.data.message);
      setSuccess(true);
      setUser((prev) => ({
        ...prev,
        balance: prev.balance - amt,
        upiId,
      }));
      setAmount("");
    } catch (err) {
      const msg = err.response?.data?.message || "Withdraw failed";
      alert(msg);
      if (err.response?.data?.redirectTo === "deposit") {
        setCurrentPage("deposit");
      }
      if (err.response?.data?.redirectTo === "home") {
        setCurrentPage("home");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdraw-page">
      <div className="withdraw-card">
        <h3>Withdraw via UPI</h3>

        <form onSubmit={handleSubmit} className="withdraw-form">
          <div className="input-group">
            <label>UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="example@paytm"
              disabled={loading || success}
              className="withdraw-input"
            />
            {upiId && !user.upiId && (
              <p className="upi-save-note">UPI ID will be saved for future</p>
            )}
          </div>

          <div className="input-group">
            <label>Amount (₹) - Min 100</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="100"
              max={user.balance}
              disabled={loading || success}
              className="withdraw-input"
            />
          </div>

          {success ? (
            <div className="success-message">
              ✅ Withdraw request submitted!
              <br />
              Admin will send amount to your UPI within 24 hours
            </div>
          ) : (
            <button
              type="submit"
              className="withdraw-submit-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit Withdraw"}
            </button>
          )}
        </form>

        <div className="withdraw-info">
          <div className="balance-info">
            <span>Available Balance:</span>
            <strong>₹{user.balance.toLocaleString()}</strong>
          </div>
          <div className="min-max">
            <span>Min ₹100 | Max ₹{user.balance.toLocaleString()}</span>
          </div>
          <div className="min-max">
            <span>Wagering left: ₹{user.wageringReq || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WithdrawPage;
