import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      navigate("/discover", { replace: true }); 
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Hmm, those details don't quite match our records. Let's give it another try!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs scaled down by 20% */}
      <div className="absolute top-1/4 left-1/4 md:left-1/3 w-40 md:w-52 h-40 md:h-52 bg-red-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 md:right-1/3 w-40 md:w-52 h-40 md:h-52 bg-rose-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse delay-700" />

      {/* ENTERPRISE SIZING MATH:
        Original max-w-md = 448px. 20% reduction = ~358px (max-w-[358px]).
        Original p-10 = 40px. 20% reduction = 32px (p-8). 
      */}
      <div className="w-full max-w-[358px] p-6 md:p-8 rounded-[1.5rem] shadow-2xl relative z-10 animate-slide-up bg-white/85 backdrop-blur-xl border border-red-500/20">
        
        <div className="text-center mb-6">
          {/* IMAGE/ICON CONTAINER:
            Original was w-16 h-16 (64px). 
            Increased by 10% exactly = 70.4px. 
          */}
          <div className="inline-flex items-center justify-center w-[70px] h-[70px] bg-red-50 rounded-xl mb-3 text-red-500 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          
          {/* Typography scaled down by 20% */}
          <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 font-medium text-[11px] md:text-xs mt-1">Find your connection today</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] font-bold flex items-start animate-in slide-in-from-top-2">
            <AlertCircle className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
          <div className="relative group">
            <label className="absolute left-3.5 top-1.5 text-gray-400 text-[9px] font-bold transition-all duration-300">Email Address</label>
            {/* Inputs scaled down by 20% */}
            <input 
              type="email" 
              required 
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50/50 border-2 border-gray-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-red-400 focus:bg-white transition-all font-semibold text-gray-700 pt-5 text-xs"
            />
            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-focus-within:text-red-500 transition-colors" />
          </div>

          <div className="relative group">
            <label className="absolute left-3.5 top-1.5 text-gray-400 text-[9px] font-bold transition-all duration-300">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50/50 border-2 border-gray-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-red-400 focus:bg-white transition-all font-semibold text-gray-700 pt-5 text-xs"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 group-focus-within:text-red-500 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors">Forgot Password?</a>
          </div>

          {/* Button padding and font scaled down by 20% */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full text-white font-black py-2.5 rounded-xl shadow-lg hover:shadow-red-500/40 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-rose-500 disabled:opacity-70 disabled:hover:translate-y-0 text-xs md:text-sm"
          >
            <span>{loading ? "Verifying..." : "Unlock Connection"}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <p className="text-gray-500 font-medium text-[11px] md:text-xs">
            New to TLC?{" "}
            <Link to="/signup" className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 font-black hover:opacity-80 transition-opacity">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}