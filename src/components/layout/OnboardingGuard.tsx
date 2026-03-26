import { useEffect, useState, useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingStatus {
  profileDone: boolean;
  kycDone: boolean;
  loading: boolean;
}

export function OnboardingGuard() {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  
  const [status, setStatus] = useState<OnboardingStatus>({
    profileDone: false,
    kycDone: false,
    loading: true,
  });

  const memoizedUserId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    if (!memoizedUserId) return;

    let isMounted = true;

    async function checkProgress() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, kyc_status')
          .eq('id', memoizedUserId)
          .single();

        // PGRST116 means no profile row exists yet (Brand new user)
        if (error && error.code !== 'PGRST116') throw error;

        if (isMounted) {
          setStatus({
            profileDone: !!data?.display_name,
            kycDone: data?.kyc_status === 'approved' || data?.kyc_status === 'pending',
            loading: false
          });
        }
      } catch (err) {
        console.error("[OnboardingGuard] Verification Error:", err);
        if (isMounted) setStatus(prev => ({ ...prev, loading: false }));
      }
    }

    checkProgress();
    return () => { isMounted = false; };
  }, [memoizedUserId, location.pathname]);

  if (authLoading || status.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9]">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4" />
        <p className="text-pink-500 font-bold tracking-tight animate-pulse text-sm uppercase">
          Securing Connection...
        </p>
      </div>
    );
  }

  const currentPath = location.pathname;

  // 1. Force to Setup if profile is incomplete
  if (!status.profileDone && currentPath !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  // 2. Force to KYC if profile is done, but KYC is missing
  if (status.profileDone && !status.kycDone && !['/kyc', '/setup'].includes(currentPath)) {
    return <Navigate to="/kyc" replace />;
  }

  // 3. Prevent returning to Setup/KYC if everything is already done
  if (status.profileDone && status.kycDone && ['/setup', '/kyc'].includes(currentPath)) {
    return <Navigate to="/discover" replace />;
  }

  return <Outlet />;
}