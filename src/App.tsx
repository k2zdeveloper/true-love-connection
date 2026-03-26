import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeProvider"; // Ensure this matches your file name
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { OnboardingGuard } from "@/components/layout/OnboardingGuard";
import { GuestRoute } from "@/components/layout/GuestRoute";
import { Navbar } from "@/components/layout/Navbar";
import { MatchModal } from "@/components/ui/MatchModal";
import { Heart, AlertCircle, ArrowLeft } from "lucide-react";
import { LandingPage } from "@/features/home/LandingPage";

// Core Flows
const Login = lazy(() => import("@/features/auth/Login").then(m => ({ default: m.Login })));
const Signup = lazy(() => import("@/features/auth/Signup").then(m => ({ default: m.Signup })));
const ProfileSetup = lazy(() => import("@/features/onboarding/ProfileSetup").then(m => ({ default: m.ProfileSetup })));
const KYC = lazy(() => import("@/features/onboarding/KYC").then(m => ({ default: m.KYC })));
const Discover = lazy(() => import("@/features/discover/Discover").then(m => ({ default: m.Discover })));

// New Integrations
const Chat = lazy(() => import("@/features/matches/Chat").then(m => ({ default: m.Chat })));
const RadarMap = lazy(() => import("@/features/discover/RadarMap").then(m => ({ default: m.RadarMap })));
const Subscription = lazy(() => import("@/features/subscription/Subscription").then(m => ({ default: m.Subscription })));
const StoryUpload = lazy(() => import("@/features/stories/StoryUpload").then(m => ({ default: m.StoryUpload })));
const StoryViewer = lazy(() => import("@/features/stories/StoryViewer").then(m => ({ default: m.StoryViewer })));

// Scaled down 20% to match the new Hot Red aesthetic
const PageLoader = () => (
  <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#fafaf9]">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-bounce mb-3 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
      <Heart className="w-6 h-6 text-red-500 fill-current" />
    </div>
    <div className="text-red-500 font-bold tracking-widest uppercase text-[10px] animate-pulse">
      Loading...
    </div>
  </div>
);

// Enterprise Graceful Degradation for broken links
const NotFound = () => (
  <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#fafaf9] px-4 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
      <AlertCircle className="w-10 h-10 text-gray-400" />
    </div>
    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Lost in the crowd?</h1>
    <p className="text-gray-500 font-medium text-xs md:text-sm mb-6 max-w-md">
      The page you're looking for doesn't exist or has been moved. Let's get you back to finding your match.
    </p>
    <Link to="/" className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-lg text-xs md:text-sm">
      <ArrowLeft className="w-4 h-4 mr-2" /> Go Back Home
    </Link>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Router>
          <div className="min-h-screen bg-[#fafaf9] font-sans antialiased text-gray-800 flex flex-col">
            <Navbar />
            <MatchModal />
            <main className="flex-1 w-full relative z-0">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  
                  {/* Public Guest Routes (Blocks logged in users from seeing login/signup) */}
                  <Route element={<GuestRoute />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                  </Route>

                  {/* Secure Authenticated Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<OnboardingGuard />}>
                      
                      {/* Onboarding Flow */}
                      <Route path="/setup" element={<ProfileSetup />} />
                      <Route path="/kyc" element={<KYC />} />
                      
                      {/* Core Application Flow */}
                      <Route path="/discover" element={<Discover />} />
                      <Route path="/chat/:matchId?" element={<Chat />} />
                      <Route path="/radar" element={<RadarMap />} />
                      <Route path="/subscription" element={<Subscription />} />
                      <Route path="/story/upload" element={<StoryUpload />} />
                      <Route path="/story/:userId" element={<StoryViewer />} />
                      
                    </Route>
                  </Route>

                  {/* Catch-all redirect for 404s */}
                  <Route path="*" element={<NotFound />} />
                  
                </Routes>
              </Suspense>
            </main>
          </div>
        </Router>
      </RealtimeProvider>
    </AuthProvider>
  );
}