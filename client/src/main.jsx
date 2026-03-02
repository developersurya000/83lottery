import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./style.css";
import "./App.css";
import "./index.css"; // if this file exists
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import InstagramLogin from "./instagram/Login";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<App />} />
        <Route path="/instagram/login" element={<InstagramLogin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
