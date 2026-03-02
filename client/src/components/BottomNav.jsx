import { Coins, Wallet, User, ListChecks } from "lucide-react";

function BottomNav({ currentPage, setCurrentPage }) {
  return (
    <div className="bottom-nav-container">
      <div className="nav-bar">
        <div
          className={`nav-item ${
            currentPage === "home" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("home")}
        >
          <Coins size={26} />
          <span>Home</span>
        </div>

        {/* NEW TASKS TAB */}
        <div
          className={`nav-item ${
            currentPage === "tasks" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("tasks")}
        >
          <ListChecks size={26} />
          <span>Tasks</span>
        </div>

        <div
          className={`nav-item ${
            currentPage === "wallet" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("wallet")}
        >
          <Wallet size={26} />
          <span>Wallet</span>
        </div>
        <div
          className={`nav-item ${
            currentPage === "account" ? "active" : ""
          }`}
          onClick={() => setCurrentPage("account")}
        >
          <User size={26} />
          <span>Account</span>
        </div>
      </div>
    </div>
  );
}

export default BottomNav;
