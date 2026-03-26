import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Infinity, Send, Zap, Filter, Star, Eye, ArrowRight, Sparkles } from "lucide-react";

export function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<string>("premium_plus");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // In a production app, this would hit your Stripe/Payment gateway first.
      // Here, we simulate the database profile upgrade directly.
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: selectedTier })
        .eq('id', user.id);

      if (error) throw error;
      
      setSuccess(true);
      // Redirect back to discover after a brief success message
      setTimeout(() => navigate('/discover', { replace: true }), 2000);
    } catch (err) {
      console.error("Upgrade failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] py-8 md:py-12 px-4 overflow-hidden bg-[#fafaf9]">
      {/* Background Ambient Blobs */}
      <div className="absolute -top-20 -left-20 w-52 md:w-80 h-52 md:h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-52 md:w-80 h-52 md:h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-red-500">Pure Connection</span>
          </h2>
          <p className="text-gray-500 font-bold text-[11px] md:text-xs">Choose a plan that fits your journey in the Nation.</p>
        </div>

        {success && (
          <div className="mb-6 p-3.5 bg-green-50 border-2 border-green-100 text-green-600 font-black rounded-xl text-center text-[11px] md:text-xs animate-bounce flex items-center justify-center">
            <Sparkles className="w-4 h-4 mr-2 shrink-0" /> Welcome to the Elite! Redirecting...
          </div>
        )}

        <form onSubmit={handleUpgrade}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            
            {/* TIER 1: Premium */}
            <label className="relative cursor-pointer group">
              <input type="radio" name="tier" value="premium" checked={selectedTier === 'premium'} onChange={() => setSelectedTier('premium')} className="peer hidden" />
              <div className="p-5 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] bg-white/80 backdrop-blur-xl border-[1.5px] border-gray-100 h-full flex flex-col transition-all duration-300 peer-checked:border-rose-400 peer-checked:bg-white peer-checked:shadow-[0_10px_30px_rgba(225,29,72,0.15)] peer-checked:scale-105">
                <div className={`w-4 h-4 rounded-full border-[1.5px] mb-4 flex items-center justify-center transition-all ${selectedTier === 'premium' ? 'bg-rose-500 border-rose-500' : 'border-gray-300'}`}>
                  {selectedTier === 'premium' && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <h3 className="text-base md:text-lg font-black text-gray-800 mb-1">Premium</h3>
                <p className="text-rose-500 font-black text-xl md:text-2xl mb-4">$4.99<span className="text-[9px] md:text-[10px] text-gray-400 font-bold">/mo</span></p>
                <ul className="space-y-2.5 flex-grow mb-5">
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-500"><Infinity className="w-3 h-3 text-rose-400 mr-2 shrink-0" /> Unlimited Swipes</li>
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-500"><Send className="w-3 h-3 text-rose-400 mr-2 shrink-0" /> 200 Messages/day</li>
                </ul>
              </div>
            </label>

            {/* TIER 2: Premium+ (Most Popular) */}
            <label className="relative cursor-pointer group">
              <input type="radio" name="tier" value="premium_plus" checked={selectedTier === 'premium_plus'} onChange={() => setSelectedTier('premium_plus')} className="peer hidden" />
              <div className="p-5 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] bg-white/80 backdrop-blur-xl border-[1.5px] border-red-200 h-full flex flex-col transition-all duration-300 peer-checked:border-red-500 peer-checked:bg-white peer-checked:shadow-[0_15px_40px_rgba(220,38,38,0.2)] peer-checked:scale-105 md:peer-checked:scale-110 z-10">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[8px] md:text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">Most Popular</div>
                <div className={`w-4 h-4 rounded-full border-[1.5px] mb-4 flex items-center justify-center transition-all ${selectedTier === 'premium_plus' ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {selectedTier === 'premium_plus' && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <h3 className="text-base md:text-lg font-black text-gray-800 mb-1">Premium+</h3>
                <p className="text-red-600 font-black text-xl md:text-2xl mb-4">$9.99<span className="text-[9px] md:text-[10px] text-gray-400 font-bold">/mo</span></p>
                <ul className="space-y-2.5 flex-grow mb-5">
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-500"><Zap className="w-3 h-3 text-red-400 mr-2 shrink-0" /> Compatibility Score</li>
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-500"><Filter className="w-3 h-3 text-red-400 mr-2 shrink-0" /> Unlimited Filters</li>
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-500"><Infinity className="w-3 h-3 text-red-400 mr-2 shrink-0" /> Everything in Premium</li>
                </ul>
              </div>
            </label>

            {/* TIER 3: VIP */}
            <label className="relative cursor-pointer group">
              <input type="radio" name="tier" value="vip" checked={selectedTier === 'vip'} onChange={() => setSelectedTier('vip')} className="peer hidden" />
              <div className="p-5 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] bg-gray-900/95 backdrop-blur-xl border-[1.5px] border-gray-800 h-full flex flex-col transition-all duration-300 peer-checked:border-amber-400 peer-checked:bg-gray-900 peer-checked:shadow-[0_10px_30px_rgba(251,191,36,0.15)] peer-checked:scale-105">
                <div className={`w-4 h-4 rounded-full border-[1.5px] mb-4 flex items-center justify-center transition-all ${selectedTier === 'vip' ? 'bg-amber-400 border-amber-400' : 'border-gray-600'}`}>
                  {selectedTier === 'vip' && <Check className="w-2.5 h-2.5 text-gray-900" />}
                </div>
                <h3 className="text-base md:text-lg font-black text-white mb-1">VIP Elite</h3>
                <p className="text-amber-400 font-black text-xl md:text-2xl mb-4">$14.99<span className="text-[9px] md:text-[10px] text-gray-500 font-bold">/mo</span></p>
                <ul className="space-y-2.5 flex-grow mb-5">
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-300"><Star className="w-3 h-3 text-amber-400 mr-2 shrink-0" /> Priority Matching</li>
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-300"><Eye className="w-3 h-3 text-amber-400 mr-2 shrink-0" /> Read Receipts</li>
                  <li className="flex items-center text-[10px] md:text-[11px] font-bold text-gray-300"><Zap className="w-3 h-3 text-amber-400 mr-2 shrink-0" /> 2 Free Boosts/mo</li>
                </ul>
              </div>
            </label>

          </div>

          <div className="mt-8 md:mt-10 text-center">
            <button 
              type="submit" 
              disabled={loading || success}
              className="px-8 md:px-10 py-3 md:py-3.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-500 rounded-full text-white font-black text-[10px] md:text-[11px] tracking-wider uppercase shadow-[0_6px_20px_rgba(225,29,72,0.4)] hover:shadow-[0_10px_25px_rgba(225,29,72,0.6)] transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center mx-auto disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Upgrade Now <ArrowRight className="w-3.5 h-3.5 ml-2" /></>
              )}
            </button>
            <p className="mt-3.5 md:mt-4 text-gray-400 text-[8px] md:text-[9px] font-bold">Secure checkout via encrypted gateway. Cancel anytime.</p>
          </div>
        </form>
      </div>
    </div>
  );
}