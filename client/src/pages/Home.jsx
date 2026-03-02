import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import axios from "axios";

function Home({ user, setUser }) {
  const [betAmount, setBetAmount] = useState(100);
  const [selectedSide, setSelectedSide] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [gameResult, setGameResult] = useState("");

  // always use latest user.balance
  useEffect(() => {
    if (betAmount > user.balance) {
      setBetAmount(user.balance);
    }
  }, [user.balance]);

  const flipCoin = () => {
    if (betAmount > user.balance || betAmount <= 0 || !selectedSide) {
      alert("Select side and enter valid bet");
      return;
    }

    setIsFlipping(true);
    setFinalResult(null);
    setGameResult("");

    // 5s animation, but result comes from backend pattern logic
    setTimeout(async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/api/game/bet`,
          {
            betAmount: Number(betAmount),
            selectedSide,
          },
          { withCredentials: true }
        );

        const { isWin, newBalance, bonus, wageringReq } = res.data;

        // visually show whatever side user chose (your design)
        setFinalResult(selectedSide);

        setTimeout(() => {
          setUser((prev) => ({
            ...prev,
            balance: newBalance,
            bonus,
            wageringReq,
          }));
          setGameResult(isWin ? "WIN" : "LOSE");
          setIsFlipping(false);
        }, 800);
      } catch (err) {
        alert(err.response?.data?.message || "Bet failed");
        setIsFlipping(false);
      }
    }, 4800);
  };

  return (
    <div className="home-page">
      <div className="balance-card">
        <h2>₹{user.balance.toLocaleString()}</h2>
        <span>Available Balance</span>
      </div>

      <div className="game-section">
        <h3 className="game-title">Heads or Tails</h3>

        <div className="bet-input">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min="10"
            max={user.balance}
            disabled={isFlipping}
            className="bet-input-field"
          />
          <button
            className="max-btn"
            onClick={() => setBetAmount(user.balance)}
            disabled={isFlipping}
          >
            MAX
          </button>
        </div>

        <div className="coin-choices">
          <button
            className={`coin-btn ${
              selectedSide === "heads" ? "active" : ""
            } ${isFlipping ? "disabled" : ""}`}
            onClick={() => !isFlipping && setSelectedSide("heads")}
          >
            <span className="coin-emoji">🪙</span>
            <span>Heads</span>
          </button>
          <button
            className={`coin-btn ${
              selectedSide === "tails" ? "active" : ""
            } ${isFlipping ? "disabled" : ""}`}
            onClick={() => !isFlipping && setSelectedSide("tails")}
          >
            <span className="coin-emoji">📄</span>
            <span>Tails</span>
          </button>
        </div>

        {/* PERFECT 3D COIN */}
        <div className="coin-container">
          <div
            className={`coin ${isFlipping ? "flipping" : ""} ${
              finalResult || ""
            }`}
          >
            {/* HEADS SIDE - GOLD */}
            <div className="coin-face heads-face">
              <div className="coin-emoji">🪙</div>
              <div className="coin-label">HEADS</div>
            </div>
            {/* TAILS SIDE - SILVER */}
            <div className="coin-face tails-face">
              <div className="coin-emoji">🪡</div>
              <div className="coin-label">TAILS</div>
            </div>
          </div>
        </div>

        <button
          className="flip-btn"
          onClick={flipCoin}
          disabled={isFlipping || !selectedSide || betAmount > user.balance}
        >
          {isFlipping
            ? `FLIPPING... ${5 - Math.floor((Date.now() / 1000) % 5)}s`
            : "FLIP COIN"}
        </button>

        {gameResult && (
          <div className={`big-result ${gameResult.toLowerCase()}`}>
            {finalResult?.toUpperCase()} - {gameResult}!
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
