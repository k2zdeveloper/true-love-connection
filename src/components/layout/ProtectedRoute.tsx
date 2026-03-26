import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="animate-pulse text-pink-500 font-bold">Warming things up...</div>
      </div>
    );
  }

  // If no session exists, bounce them securely back to the login page
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected component
  return <Outlet />;
}