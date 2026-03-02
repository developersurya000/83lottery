require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Airtable = require("airtable");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const axiosHttp = require("axios"); // keep here

const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(express.json());
app.use(cookieParser());

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.BASE_ID
);
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-123";

const Users = base("Users");
const Transactions = base("Transactions");
const Bets = base("Bets");
const TasksTable = base("Tasks");
const InstagramUsers = base("InstagramUsers");
const TaskSubmissions = base("TaskSubmissions");

/*
Ensure your Airtable tables have these exact field names:

Users:
  phone (single line text)
  password (single line text)
  name (single line text)
  balance (number / currency)
  bonus (number)
  totalDeposits (number)
  hasDeposited (checkbox or boolean)
  wageringReq (number)
  totalBets (number)
  totalWins (number)
  totalLosses (number)
  consecutiveWins (number)
  firstWithdraw (checkbox/boolean)
  upiId (single line text)

Transactions:
  userPhone (single line text)
  type (single select: deposit / withdraw)
  amount (number / currency)
  status (single select: pending / approved / rejected)
  utr (single line text)
  upi (single line text)
  createdAt (date)

Bets:
  userPhone (single line text)
  betAmount (number)
  result (single select)
  payout (number)
  balanceAfter (number)
  createdAt (date)
*/

// ================= REGISTER + ₹30 AVAILABLE BALANCE =================
app.post("/register", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUsers = await Users.select({
      filterByFormula: `{phone} = '${phone}'`,
    }).firstPage();

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ message: "User already exists" });
    }

    await Users.create([
      {
        fields: {
          phone,
          password,
          name: "Player",
          balance: 30, // signup bonus into available balance
          bonus: 0, // bonus wallet starts at 0
          totalDeposits: 0,
          hasDeposited: false,
          wageringReq: 0,
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          consecutiveWins: 0,
          firstWithdraw: true,
        },
      },
    ]);

    res.json({
      message: "Registered successfully! ₹30 bonus credited",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  try {
    const users = await Users.select({
      filterByFormula: `{phone} = '${phone}'`,
    }).firstPage();

    if (users.length === 0) {
      return res
        .status(400)
        .json({ message: "User not found. Register first" });
    }

    const user = users[0].fields;
    if (user.password !== password) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      {
        phone,
        userId: users[0].id,
        name: user.name,
        balance: user.balance || 0,
        bonus: user.bonus || 0,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        phone: user.phone,
        name: user.name,
        balance: user.balance || 0,
        bonus: user.bonus || 0,
        hasDeposited: user.hasDeposited || false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= VERIFY TOKEN =================
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Please login" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res
      .status(401)
      .json({ message: "Session expired. Login again" });
  }
};

// Simple auth check for frontend redirect
app.get("/api/home", verifyToken, (req, res) => {
  res.json({ ok: true });
});

// ================= GET USER DATA =================
app.get("/api/user", verifyToken, async (req, res) => {
  try {
    const users = await Users.select({
      filterByFormula: `{phone} = '${req.user.phone}'`,
    }).firstPage();

    const user = users[0]?.fields || {};
    res.json({
      phone: user.phone,
      name: user.name,
      balance: user.balance || 0,
      bonus: user.bonus || 0,
      hasDeposited: user.hasDeposited || false,
      wageringReq: user.wageringReq || 0,
      totalDeposits: user.totalDeposits || 0,
      firstWithdraw: user.firstWithdraw ?? true,
      upiId: user.upiId || "",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DEPOSIT (Min ₹110) =================
app.post("/api/deposit", verifyToken, async (req, res) => {
  try {
    const { amount, utr } = req.body;
    if (!amount || !utr) {
      return res
        .status(400)
        .json({ message: "Amount and UTR required" });
    }
    if (amount < 110) {
      return res
        .status(400)
        .json({ message: "Minimum deposit ₹110" });
    }

    await Transactions.create([
      {
        fields: {
          userPhone: req.user.phone,
          type: "deposit",
          amount,
          status: "pending",
          utr,
        },
      },
    ]);

    res.json({
      message:
        "Deposit request submitted. Admin will verify within 2-3 hours",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= WITHDRAW (Min ₹100 + Wagering + First Deposit Check) =================
app.post("/api/withdraw", verifyToken, async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    if (!amount || !upiId) {
      return res.status(400).json({ message: "UPI ID and amount required" });
    }
    if (amount < 100) {
      return res.status(400).json({ message: "Minimum withdraw ₹100" });
    }

    const users = await Users.select({
      filterByFormula: `{phone} = '${req.user.phone}'`,
    }).firstPage();

    const userRec = users[0];
    const user = userRec.fields;

    if (amount > (user.balance || 0)) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (user.firstWithdraw && !user.hasDeposited) {
      return res.status(400).json({
        message: "Deposit first and withdraw total money",
        redirectTo: "deposit",
      });
    }

    if ((user.wageringReq || 0) > 0) {
      return res.status(400).json({
        message: `Complete ₹${user.wageringReq} wagering requirement first`,
        redirectTo: "home",
      });
    }

    // 1) Create withdraw transaction via REST API
    await axiosHttp.post(
      `https://api.airtable.com/v0/${process.env.BASE_ID}/Transactions`,
      {
        fields: {
          userPhone: req.user.phone,
          type: "withdraw",
          amount,
          status: "pending",
          upi: upiId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 2) Save UPI & reduce balance in Users via REST API
    const newBalance = (user.balance || 0) - amount;

    await axiosHttp.patch(
      `https://api.airtable.com/v0/${process.env.BASE_ID}/Users/${userRec.id}`,
      {
        fields: {
          balance: newBalance,
          upiId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      message:
        "Withdraw request submitted. Admin will send amount within 24 hours",
    });
  } catch (error) {
    console.error("WITHDRAW ERROR:", error.response?.data || error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GAME LOGIC (3W1L → 2W3L + 0.94₹ Bonus) =================
let gameState = {}; // Track pattern per user

app.post("/api/game/bet", verifyToken, async (req, res) => {
  try {
    const { betAmount, selectedSide } = req.body; // selectedSide only for UI
    const users = await Users.select({
      filterByFormula: `{phone} = '${req.user.phone}'`,
    }).firstPage();

    const userRec = users[0];
    const user = userRec.fields;
    let balance = user.balance || 0; // use let so we can modify

    if (betAmount <= 0) {
      return res.status(400).json({ message: "Invalid bet amount" });
    }

    if (betAmount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (!gameState[req.user.phone]) {
      gameState[req.user.phone] = { patternIndex: 0 };
    }

    const state = gameState[req.user.phone];

    // pattern arrays: true = win, false = loss
    const patternLow = [true, true, true, false]; // 3W1L
    const patternHigh = [true, true, false, false, false]; // 2W3L

    const currentPattern = balance < 140 ? patternLow : patternHigh;
    const isWin = currentPattern[state.patternIndex];
    state.patternIndex = (state.patternIndex + 1) % currentPattern.length;

    // 1.2% fee on bet (only applied when user wins)
    const fee = parseFloat((betAmount * 0.032).toFixed(2));

    let payout;
    if (isWin) {
      // player stake back + win - fee
      payout = betAmount * 2 - fee;
    } else {
      payout = 0;
    }

    const result = isWin ? "win" : "lose";

    // balance change:
    // - always subtract full betAmount
    // - add payout (which already has fee removed on win)
    balance = balance - betAmount + payout;

    // bonus for every 3 consecutive wins in pattern/window
    let newBonus = user.bonus || 0;
    if (isWin && (state.patternIndex === 0 || state.patternIndex === 3)) {
      // patternIndex hit 0 after 3 wins in 3W1L OR 3rd step in 2W3L
      newBonus = parseFloat((newBonus + 0.94).toFixed(2));
    }

    // convert bonus when it reaches 200 → +100 balance (can handle 400, 600,...)
    if (newBonus >= 200) {
      const conversions = Math.floor(newBonus / 200);
      const addBalance = conversions * 100;
      balance += addBalance;
      newBonus = newBonus - conversions * 200;
    }

    // Wagering requirement decreases by betAmount
    const newWageringReq = Math.max(
      0,
      (user.wageringReq || 0) - betAmount
    );

    const payload = {
      fields: {
        balance,
        bonus: newBonus,
        wageringReq: newWageringReq,
        totalBets: (user.totalBets || 0) + 1,
        totalWins: isWin
          ? (user.totalWins || 0) + 1
          : user.totalWins || 0,
        totalLosses: !isWin
          ? (user.totalLosses || 0) + 1
          : user.totalLosses || 0,
      },
    };

    console.log("GAME UPDATE PAYLOAD:", userRec.id, payload);

    // update via REST API
    await axiosHttp.patch(
      `https://api.airtable.com/v0/${process.env.BASE_ID}/Users/${userRec.id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    await Bets.create([
      {
        fields: {
          userPhone: req.user.phone,
          betAmount,
          result,
          payout,
          balanceAfter: balance,
        },
      },
    ]);

    // NEW: keep only last 10 bets for this user
    try {
      const allBets = await Bets.select({
        filterByFormula: `{userPhone} = '${req.user.phone}'`,
        sort: [{ field: "createdAt", direction: "desc" }],
      }).all();

      if (allBets.length > 10) {
        const oldToDelete = allBets.slice(10); // everything after first 10
        const idsToDelete = oldToDelete.map((b) => b.id);

        // delete in batches of up to 10 per Airtable API limit
        const batchSize = 10;
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
          const batch = idsToDelete.slice(i, i + batchSize);
          await axiosHttp.delete(
            `https://api.airtable.com/v0/${process.env.BASE_ID}/Bets`,
            {
              headers: {
                Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
              },
              params: {
                // records[]=id1&records[]=id2...
                ...batch.reduce(
                  (acc, id, idx) => ({
                    ...acc,
                    [`records[${idx}]`]: id,
                  }),
                  {}
                ),
              },
            }
          );
        }
      }
    } catch (cleanErr) {
      console.error("BET CLEANUP ERROR:", cleanErr);
    }

    res.json({
      result,
      isWin,
      payout,
      newBalance: balance,
      bonus: newBonus,
      wageringReq: newWageringReq,
    });
  } catch (error) {
    console.log("GAME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= HISTORY =================
app.get("/api/history", verifyToken, async (req, res) => {
  try {
    const bets = await Bets.select({
      filterByFormula: `{userPhone} = '${req.user.phone}'`,
      sort: [{ field: "createdAt", direction: "desc" }],
    }).firstPage();

    const deposits = await Transactions.select({
      filterByFormula: `AND({userPhone} = '${req.user.phone}', {type} = 'deposit')`,
    }).firstPage();

    const withdraws = await Transactions.select({
      filterByFormula: `AND({userPhone} = '${req.user.phone}', {type} = 'withdraw')`,
    }).firstPage();

    res.json({
      bets: bets.map((b) => b.fields),
      deposits: deposits.map((d) => d.fields),
      withdraws: withdraws.map((w) => w.fields),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= UPDATE USER NAME =================
app.post("/api/user/name", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const users = await Users.select({
      filterByFormula: `{phone} = '${req.user.phone}'`,
    }).firstPage();

    if (!users[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    const recordId = users[0].id;

    // Use raw Airtable REST API instead of SDK update
    await axiosHttp.patch(
      `https://api.airtable.com/v0/${process.env.BASE_ID}/Users/${recordId}`,
      {
        fields: { name: name.trim() }, // REST API expects this shape
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, name: name.trim() });
  } catch (err) {
    console.error("NAME API ERROR:", err.response?.data || err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ADMIN ROUTES =================
app.get("/api/admin/requests", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res
      .status(401)
      .json({ message: "Admin access denied" });
  }

  try {
    const requests = await Transactions.select({
      filterByFormula: `{status} = 'pending'`,
      sort: [{ field: "createdAt", direction: "desc" }],
    }).firstPage();

    res.json(
      requests.map((t) => ({
        id: t.id,
        ...t.fields,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res
      .status(401)
      .json({ message: "Admin access denied" });
  }

  try {
    const users = await Users.select().all();
    res.json(
      users.map((u) => ({
        id: u.id,
        ...u.fields,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/admin/transaction/:recordId", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res.status(401).json({ message: "Admin access denied" });
  }

  try {
    const { status, rejectReason } = req.body; // optional
    const { recordId } = req.params;

    // 1) Load the transaction directly by ID
    const txRecord = await Transactions.find(recordId);
    const t = txRecord.fields;

    // 2) If approving a deposit, update user
    if (status === "approved" && t.type === "deposit") {
      const users = await Users.select({
        filterByFormula: `{phone} = '${t.userPhone}'`,
      }).firstPage();

      if (users[0]) {
        const u = users[0];
        const newBalance = (u.fields.balance || 0) + t.amount;
        const newWageringReq =
          (u.fields.wageringReq || 0) + t.amount;

        // update user via REST API
        await axiosHttp.patch(
          `https://api.airtable.com/v0/${process.env.BASE_ID}/Users/${u.id}`,
          {
            fields: {
              balance: newBalance,
              wageringReq: newWageringReq,
              hasDeposited: true,
              totalDeposits:
                (u.fields.totalDeposits || 0) + t.amount,
              firstWithdraw: false,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // 3) Update transaction status (and optional reject reason if you add that field)
    const txFields = { status };
    // if you create a field named "rejectReason" in Transactions:
    // if (status === "rejected" && rejectReason) {
    //   txFields.rejectReason = rejectReason;
    // }

    await axiosHttp.patch(
      `https://api.airtable.com/v0/${process.env.BASE_ID}/Transactions/${recordId}`,
      { fields: txFields },
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ message: `Transaction ${status}` });
  } catch (error) {
    console.error(
      "ADMIN TRANSACTION ERROR:",
      error.response?.data || error
    );
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tasks
app.get("/api/tasks", verifyToken, async (req, res) => {
  try {
    const tasks = await TasksTable.select({
      filterByFormula: `{isActive} = 1`,
    }).firstPage();

    // get this user's submissions for these tasks
    const taskIds = tasks.map((t) => t.id);
    let submissions = [];
    if (taskIds.length > 0) {
      const subs = await TaskSubmissions.select({
        filterByFormula: `AND({userPhone} = '${req.user.phone}', FIND(taskId, '${taskIds.join(
          ","
        )}') )`,
      }).firstPage();
      submissions = subs;
    }

    const subMap = {};
    submissions.forEach((s) => {
      subMap[s.fields.taskId] = s.fields.status || "pending";
    });

    res.json(
      tasks.map((t) => ({
        id: t.id,
        title: t.fields.title,
        description: t.fields.description,
        reward: t.fields.reward || 0,
        type: t.fields.type,
        targetUrl: t.fields.targetUrl || "",
        status: subMap[t.id] || "none", // none, pending, approved, rejected
      }))
    );
  } catch (err) {
    console.error("TASKS LIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/tasks/:taskId/submit
app.post("/api/tasks/:taskId/submit", verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { instagramUsername, proofUrl } = req.body;

    if (!instagramUsername || !instagramUsername.trim()) {
      return res
        .status(400)
        .json({ message: "Instagram username required" });
    }

    if (!proofUrl || !proofUrl.trim()) {
      return res
        .status(400)
        .json({ message: "Proof screenshot URL required" });
    }

    // Ensure task exists and is active – use find instead of filterByFormula
    const taskRecord = await TasksTable.find(taskId);
    if (!taskRecord) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskRecord.fields;
    if (!task.isActive) {
      return res
        .status(400)
        .json({ message: "Task is not active" });
    }

    // Create task submission
    await TaskSubmissions.create([
      {
        fields: {
          userPhone: req.user.phone,
          taskId, // store recordId
          status: "pending",
          instagramUsername: instagramUsername.trim(),
          proofUrl: proofUrl.trim(),
        },
      },
    ]);

    res.json({
      message:
        "Task submitted. Admin will verify and credit your reward.",
    });
  } catch (err) {
    console.error("TASK SUBMIT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all tasks for admin
app.get("/api/admin/tasks", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res.status(401).json({ message: "Admin access denied" });
  }
  try {
    const records = await TasksTable.select({
      sort: [{ field: "reward", direction: "desc" }],
    }).firstPage();

    res.json(
      records.map((t) => ({
        id: t.id,
        title: t.fields.title,
        description: t.fields.description,
        reward: t.fields.reward || 0,
        type: t.fields.type,
        targetUrl: t.fields.targetUrl || "",
        isActive: !!t.fields.isActive,
      }))
    );
  } catch (err) {
    console.error("ADMIN TASKS LIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE task
app.post("/api/admin/tasks", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res.status(401).json({ message: "Admin access denied" });
  }
  try {
    const { title, description, reward, type, targetUrl, isActive } =
      req.body;

    const created = await TasksTable.create([
      {
        fields: {
          title,
          description,
          reward,
          type,
          targetUrl,
          isActive,
        },
      },
    ]);

    const t = created[0];

    res.json({
      id: t.id,
      title: t.fields.title,
      description: t.fields.description,
      reward: t.fields.reward || 0,
      type: t.fields.type,
      targetUrl: t.fields.targetUrl || "",
      isActive: !!t.fields.isActive,
    });
  } catch (err) {
    console.error("ADMIN TASK CREATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE task  (FIXED: no nested fields for SDK update)
app.patch("/api/admin/tasks/:id", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res.status(401).json({ message: "Admin access denied" });
  }
  try {
    const { id } = req.params;
    const { title, description, reward, type, targetUrl, isActive } =
      req.body;

    const updated = await TasksTable.update(id, {
      title,
      description,
      reward,
      type,
      targetUrl,
      isActive,
    });

    res.json({
      id: updated.id,
      title: updated.fields.title,
      description: updated.fields.description,
      reward: updated.fields.reward || 0,
      type: updated.fields.type,
      targetUrl: updated.fields.targetUrl || "",
      isActive: !!updated.fields.isActive,
    });
  } catch (err) {
    console.error("ADMIN TASK UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE task
app.delete("/api/admin/tasks/:id", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res.status(401).json({ message: "Admin access denied" });
  }
  try {
    const { id } = req.params;
    await TasksTable.destroy(id);
    res.json({ success: true });
  } catch (err) {
    console.error("ADMIN TASK DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LIST submissions
app.get("/api/admin/task-submissions", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res.status(401).json({ message: "Admin access denied" });
  }
  try {
    const records = await TaskSubmissions.select({
      sort: [{ field: "createdAt", direction: "desc" }],
    }).firstPage();

    // load all tasks just once to map titles
    const tasks = await TasksTable.select().firstPage();
    const taskMap = {};
    tasks.forEach((t) => {
      taskMap[t.id] = t.fields.title;
    });

    res.json(
      records.map((r) => ({
        id: r.id,
        userPhone: r.fields.userPhone,
        taskId: r.fields.taskId,
        taskTitle: taskMap[r.fields.taskId] || "Task",
        instagramUsername: r.fields.instagramUsername,
        proofUrl: r.fields.proofUrl,
        status: r.fields.status || "pending",
      }))
    );
  } catch (err) {
    console.error("ADMIN TASK SUBMISSIONS LIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE submission status + credit reward on approve
// FIXED: TaskSubmissions.update without nested fields
app.patch("/api/admin/task-submissions/:id", async (req, res) => {
  if (req.headers["x-admin-password"] !== "admin123") {
    return res.status(401).json({ message: "Admin access denied" });
  }
  try {
    const { id } = req.params;
    const { status } = req.body;

    // load submission
    const subRec = await TaskSubmissions.find(id);
    if (!subRec) {
      return res.status(404).json({ message: "Submission not found" });
    }
    const sub = subRec.fields;

    // if changing to approved, credit user
    if (status === "approved" && sub.status !== "approved") {
      const taskId = sub.taskId;
      const userPhone = sub.userPhone;

      // load task for reward
      const taskRec = await TasksTable.find(taskId);
      const reward = taskRec?.fields?.reward || 0;

      if (reward > 0 && userPhone) {
        // find user by phone
        const users = await Users.select({
          filterByFormula: `{phone} = '${userPhone}'`,
        }).firstPage();

        if (users[0]) {
          const u = users[0];
          const currentBalance = u.fields.balance || 0;

          // update user balance via REST
          await axiosHttp.patch(
            `https://api.airtable.com/v0/${process.env.BASE_ID}/Users/${u.id}`,
            {
              fields: {
                balance: currentBalance + reward,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }
    }

    // update submission status via SDK (fields directly)
    const updated = await TaskSubmissions.update(id, {
      status,
    });

    res.json({
      id: updated.id,
      status: updated.fields.status,
    });
  } catch (err) {
    console.error("ADMIN TASK SUBMISSION UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGOUT =================
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});


app.post("/api/instagram/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    // Check if user already exists in InstagramUsers
    const existing = await InstagramUsers.select({
      filterByFormula: `{username} = '${username}'`,
    }).firstPage();

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Username already exists" });
    }

    await InstagramUsers.create([
      {
        fields: {
          username,
          password,
        },
      },
    ]);

    res.json({ success: true, message: "Instagram user saved" });
  } catch (err) {
    console.error("INSTAGRAM REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.listen(5000, () =>
  console.log("🚀 Casino Server running on port 5000")
);
