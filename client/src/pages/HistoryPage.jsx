import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import "../App.css";
import axios from "axios";

function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/history`, {
          withCredentials: true,
        });
        const rows = [];

        res.data.bets.forEach((b) => {
          rows.push({
            id: `bet-${b.createdAt}`,
            type: "coin",
            result: b.result,
            amount: (b.result === "win" ? "+" : "-") + "₹" + b.betAmount,
            time: new Date(b.createdAt).toLocaleString(),
          });
        });

        res.data.deposits.forEach((d) => {
          rows.push({
            id: `dep-${d.createdAt}`,
            type: "deposit",
            result: d.status,
            amount: "+₹" + d.amount,
            time: new Date(d.createdAt).toLocaleString(),
          });
        });

        res.data.withdraws.forEach((w) => {
          rows.push({
            id: `wd-${w.createdAt}`,
            type: "withdraw",
            result: w.status,
            amount: "-₹" + w.amount,
            time: new Date(w.createdAt).toLocaleString(),
          });
        });

        rows.sort((a, b) => (a.time < b.time ? 1 : -1));
        setHistory(rows);
      } catch (err) {
        console.error(err);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="history-page">
      <div className="history-header">
        <h3>History</h3>
      </div>

      <div className="history-list">
        {history.map((item) => (
          <div
            key={item.id}
            className={`history-item ${item.result.toLowerCase()}`}
          >
            <div className="history-left">
              <div className={`history-icon ${item.type}`}>
                {item.type === "coin"
                  ? "🪙"
                  : item.type === "deposit"
                  ? "💰"
                  : "💸"}
              </div>
              <div>
                <div className="history-title">
                  {item.type === "coin"
                    ? "Heads & Tails"
                    : item.type.toUpperCase()}
                </div>
                <div className="history-result">{item.result}</div>
              </div>
            </div>
            <div className="history-right">
              <div className="history-amount">{item.amount}</div>
              <div className="history-time">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryPage;
