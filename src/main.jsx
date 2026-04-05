import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import MorphoPage from "./pages/MorphoPage";
import NavBar from "./components/NavBar";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/morpho" element={<MorphoPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
