import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";

import Auth from "./pages/Auth";
import VictimDashboard from "./pages/VictimDashboard";
import RescuerAuthGate from "./components/RescuerAuthGate";
import StatusPage from "./pages/StatusPage";
import Profile from "./pages/Profile";
import Navigation from "./components/Navigation";

function RootSwitcher() {
  const [, setRefresh] = useState({});

  useEffect(() => {
    const handleStorage = () => setRefresh({});
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const userRole = localStorage.getItem("userRole") || "";
  const profileComplete = localStorage.getItem("profileComplete");
  const currentPath = window.location.pathname;

  const role = userRole.toLowerCase();
  const isRescuer = role === "rescuer";
  const isVictim = role === "victim";

  if (
    (profileComplete !== "true" || !userRole) &&
    currentPath !== "/status" &&
    currentPath !== "/rescue-session"
  ) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col lg:flex-row w-full flex-1">
      <Navigation />

      <main className="flex-1 overflow-x-hidden overflow-y-auto h-screen bg-[#0A0A0A]">
        <Routes>
          <Route
            path="/rescuer-dashboard"
            element={
              isRescuer ? (
                <RescuerAuthGate />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              isVictim ? (
                <VictimDashboard />
              ) : (
                <Navigate to="/rescuer-dashboard" replace />
              )
            }
          />

          <Route path="/status" element={<StatusPage />} />
          <Route path="/rescue-session" element={<StatusPage />} />
          <Route path="/profile" element={<Profile />} />

          <Route
            path="*"
            element={
              <Navigate
                to={isRescuer ? "/rescuer-dashboard" : "/dashboard"}
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RootSwitcher />
      </AuthProvider>
    </Router>
  );
}