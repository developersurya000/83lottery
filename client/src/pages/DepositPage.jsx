import { useState } from "react";
import { API_BASE } from "../api";
import "../App.css";
import axios from "axios";

function DepositPage({ user, setUser, setCurrentPage }) {
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!utr || !amt || amt < 110) {
      alert("Enter valid UTR and minimum ₹110");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/api/deposit`,
        { amount: amt, utr },
        { withCredentials: true }
      );
      alert(res.data.message);
      setSuccess(true);
      setAmount("");
      setUtr("");
    } catch (err) {
      alert(err.response?.data?.message || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deposit-page">
      <div className="deposit-card">
        <h3>Scan UPI QR & Enter UTR</h3>

        <div className="qr-container">
          <img src="/qr.png" alt="UPI QR" className="upi-qr" />
          <p>Scan with your UPI app</p>
        </div>

        <form onSubmit={handleSubmit} className="deposit-form">
          <div className="input-group">
            <label>Amount (₹) - Min 110</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="110"
              disabled={loading || success}
              className="deposit-input"
            />
          </div>

          <div className="input-group">
            <label>UTR Number</label>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Enter UTR"
              disabled={loading || success}
              className="deposit-input"
            />
          </div>

          {success ? (
            <div className="success-message">
              ✅ Deposit request submitted!
              <br />
              Admin will verify UTR and add balance within 2-3 hours
            </div>
          ) : (
            <button
              type="submit"
              className="deposit-submit-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit Deposit"}
            </button>
          )}
        </form>
      </div>

      {/* Animated page dots under the form */}
      <div className="page-dots">
        <div className="page-dot active"></div>
        <div className="page-dot"></div>
        <div className="page-dot"></div>
      </div>
    </div>
  );
}

export default DepositPage;
