// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const vipId = localStorage.getItem("vipId"); // check auth

  if (!vipId) {
    return <Navigate to="/auth" replace />; // 🚀 redirect if not logged in
  }

  return children; // allow access
};

export default ProtectedRoute;
