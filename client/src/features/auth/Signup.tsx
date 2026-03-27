import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  UserPlus, Mail, Lock, Sparkles, HeartCrack, 
  CheckCircle2, Loader2, XCircle, MailOpen, ArrowRight 
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export function Signup() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccessScreen, setIsSuccessScreen] = useState(false);

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      timer = window.setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => { if (timer) window.clearInterval(timer); };
  }, [resendCooldown]);

  useEffect(() => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setEmailAvailable(null);
      setEmailError("");
      return;
    }

    const verifyEmailExistence = async () => {
      setEmailChecking(true);
      setEmailError("");
      
      try {
        const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', { lookup_email: email.toLowerCase() });
        if (rpcError) throw rpcError;
        
        if (emailExists) {
          setEmailError("This email is already in use. Try logging in!");
          setEmailAvailable(false);
        } else {
          setEmailAvailable(true);
          setEmailError("");
        }
      } catch (err) {
        setEmailAvailable(null); 
      } finally {
        setEmailChecking(false);
      }
    };

    const timeoutId = setTimeout(verifyEmailExistence, 600);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the Terms of Love to continue."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    if (emailAvailable === false) { setError("Please use a different email address or log in."); return; }

    setLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      if (data.user && data.session) {
        navigate("/setup", { replace: true });
      } else if (data.user && !data.session) {
        setIsSuccessScreen(true);
        setResendCooldown(60);
      }
    } catch (err: any) {
      setError(err.message || "Oops! We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    setResendMessage("");

    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email });
      if (resendError) throw resendError;
      setResendMessage("Confirmation email resent! Please check your spam folder.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend the email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-6 md:py-8 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-48 md:w-64 h-48 md:h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-48 md:w-64 h-48 md:h-64 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-700" />

      {isSuccessScreen ? (
        <div className="w-full max-w-md p-6 md:p-8 rounded-[1.5rem] relative z-10 animate-in zoom-in-95 bg-white/90 backdrop-blur-xl border border-red-500/20 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-red-100 to-rose-50 rounded-full mb-5 shadow-inner animate-bounce">
            <MailOpen className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Check your inbox</h2>
          
          <p className="text-gray-500 font-medium text-[11px] md:text-xs leading-relaxed mb-6">
            We've sent a secure confirmation link to <br/>
            <span className="text-gray-900 font-black text-xs bg-red-50 px-2 py-1 rounded-md mt-2 inline-block border border-red-100">{email}</span>
          </p>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border-l-[3px] border-red-500 text-red-700 text-[11px] font-bold flex items-start text-left animate-shake">
              <HeartCrack className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendMessage && (
            <div className="mb-4 p-2.5 bg-green-50 border-l-[3px] border-green-500 text-green-700 text-[11px] font-bold flex items-start text-left animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5" />
              <span>{resendMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={handleResendConfirmation}
              disabled={loading || resendCooldown > 0}
              className="w-full text-white font-black py-2.5 rounded-xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 text-[11px] uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : resendCooldown > 0 ? (
                <span>Resend available in {resendCooldown}s</span>
              ) : (
                <span>Resend Confirmation Email</span>
              )}
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="w-full text-gray-500 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center text-[11px]"
            >
              Back to Login <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md p-6 md:p-8 rounded-[1.5rem] relative z-10 animate-slide-up bg-white/80 backdrop-blur-xl border border-red-500/15 shadow-2xl">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-red-100 to-rose-50 rounded-xl mb-3 animate-heart-float">
              <UserPlus className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Join the Nation</h2>
            <p className="text-gray-500 font-bold text-[11px]">Your journey to true connection starts here.</p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border-l-[3px] border-red-500 text-red-600 text-[11px] font-bold flex items-start animate-in slide-in-from-top-2">
              <HeartCrack className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group">
              <label className={`block text-[10px] font-bold ml-2 mb-1.5 transition-colors ${
                emailAvailable === false ? 'text-red-500' : 'text-gray-700 group-focus-within:text-red-500'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  required 
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-white border-[1.5px] px-4 py-2.5 rounded-xl focus:outline-none transition-all font-semibold text-gray-700 text-xs ${
                    emailAvailable === false 
                      ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50' 
                      : emailAvailable === true
                        ? 'border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-50'
                        : 'border-gray-100 focus:border-red-400 focus:ring-4 focus:ring-red-50'
                  }`} 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                  {emailChecking ? (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  ) : emailAvailable === false ? (
                    <XCircle className="w-4 h-4 text-red-500 animate-in zoom-in" />
                  ) : emailAvailable === true ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 animate-in zoom-in" />
                  ) : (
                    <Mail className="w-4 h-4 text-gray-300 group-focus-within:text-red-400 transition-colors" />
                  )}
                </div>
              </div>
              {emailError && (
                <div className="mt-1.5 ml-2 flex items-center justify-between">
                  <p className="text-[9px] font-bold text-red-500 animate-in slide-in-from-top-1">
                    {emailError}
                  </p>
                  <Link to="/login" className="text-[9px] font-black text-red-500 hover:underline">
                    Log in instead &rarr;
                  </Link>
                </div>
              )}
            </div>

            <div className="group">
              <label className="block text-[10px] font-bold text-gray-700 ml-2 mb-1.5 group-focus-within:text-rose-500 transition-colors">
                Create Password
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  required 
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-[1.5px] border-gray-100 px-4 py-2.5 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all font-semibold text-gray-700 text-xs" 
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-rose-400 transition-colors" />
              </div>
              <p className={`text-[9px] mt-1.5 ml-2 font-medium ${password.length > 0 && password.length < 8 ? 'text-red-500' : 'text-gray-400'}`}>
                Use at least 8 characters with letters & numbers.
              </p>
            </div>

            <div className="flex items-start space-x-2.5 ml-1">
              <input 
                type="checkbox" 
                required 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500 cursor-pointer shrink-0 mt-0.5" 
              />
              <label className="text-[10px] font-bold text-gray-500 cursor-pointer" onClick={() => setAgreed(!agreed)}>
                I agree to the <a href="#" className="text-red-500 underline" onClick={(e) => e.stopPropagation()}>Terms of Love</a> & Privacy Policy.
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || emailChecking || emailAvailable === false}
              className="w-full text-white font-black py-3 rounded-xl shadow-lg hover:shadow-red-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-rose-500 disabled:opacity-70 disabled:hover:translate-y-0 text-xs uppercase tracking-wide"
            >
              <span>{loading ? "Creating Profile..." : "Create My Profile"}</span>
              {!loading && <Sparkles className="w-3.5 h-3.5 shrink-0" />}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-gray-500 font-bold text-[11px]">
              Already a member?{" "}
              <Link to="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 font-black hover:opacity-70 transition-opacity">
                Sign In instead
              </Link>
            </p>
          </div>

        </div>
      )}
    </div>
  );
}