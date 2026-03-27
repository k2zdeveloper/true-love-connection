import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#fafaf9]">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center animate-bounce mb-4 shadow-[0_0_20px_rgba(244,114,182,0.4)]">
          <Heart className="w-8 h-8 text-pink-500 fill-current" />
        </div>
        <div className="text-pink-500 font-bold tracking-widest uppercase text-sm animate-pulse">
          Authenticating Link...
        </div>
      </div>
    );
  }

  // If the user is already logged in (e.g., clicking an email confirmation link)
  // bounce them directly into the app. The OnboardingGuard will intercept this 
  // /discover request and safely redirect them to /setup or /kyc if needed.
  if (user) {
    return <Navigate to="/discover" replace />;
  }

  return <Outlet />;
}