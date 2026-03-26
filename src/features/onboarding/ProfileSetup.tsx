import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Users, ArrowRight, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "", age: "", occupation: "", bio: "",
    interestedIn: "Everyone", datingGoal: "Long-term", hobbyGoal: "Outdoor & Travel",
    preferences: [] as string[]
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) return handleNext();
    
    if (!user) {
      setError("Session expired. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: formData.name,
          age: parseInt(formData.age),
          occupation: formData.occupation,
          bio: formData.bio,
          interested_in: formData.interestedIn,
          dating_goal: formData.datingGoal,
          hobby_goal: formData.hobbyGoal,
          preferences: formData.preferences,
        });

      if (dbError) throw dbError;
      navigate("/kyc", { replace: true });
    } catch (err: any) {
      console.error("Profile save error:", err);
      setError("We hit a snag saving your profile. Please try clicking complete one more time!");
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref) 
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      <div className="text-center mb-6 md:mb-8 animate-in fade-in duration-500">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-1.5">
          Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">Identity</span>
        </h2>
        <p className="text-gray-500 font-medium text-[11px] md:text-xs">Let the nation know who you are.</p>
      </div>

      <div className="mb-8 md:mb-10 relative max-w-lg mx-auto px-2">
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gray-200 -translate-y-1/2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <div className="relative flex justify-between">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl border-[1.5px] flex items-center justify-center text-[11px] md:text-xs font-black transition-all duration-500 z-10 ${
              num <= step 
                ? 'bg-gradient-to-r from-red-500 to-rose-500 border-transparent shadow-[0_0_12px_rgba(225,29,72,0.4)] text-white' 
                : 'bg-white border-gray-200 text-gray-400'
            }`}>
              {num}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-red-500/10 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl relative overflow-hidden">
        {error && (
          <div className="mb-5 p-3 bg-red-50 border-l-[3px] border-red-500 text-red-700 text-[11px] font-bold flex items-start animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {step === 1 && (
            <div className="animate-fade-in-right">
              <h3 className="text-lg md:text-xl font-black text-gray-800 mb-5 flex items-center">
                <Sparkles className="text-red-500 w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" /> The Basics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold text-gray-600 ml-2">Display Name</label>
                  <input type="text" required placeholder="Your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50/50 border-[1.5px] border-gray-100 px-3.5 py-2.5 rounded-xl focus:border-red-400 focus:bg-white outline-none transition-all text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold text-gray-600 ml-2">Age</label>
                  <input type="number" required min="18" max="100" placeholder="18+" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})}
                    className="w-full bg-gray-50/50 border-[1.5px] border-gray-100 px-3.5 py-2.5 rounded-xl focus:border-red-400 focus:bg-white outline-none transition-all text-xs" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold text-gray-600 ml-2">Occupation</label>
                  <input type="text" placeholder="What do you do?" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})}
                    className="w-full bg-gray-50/50 border-[1.5px] border-gray-100 px-3.5 py-2.5 rounded-xl focus:border-red-400 focus:bg-white outline-none transition-all text-xs" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold text-gray-600 ml-2">Short Bio</label>
                  <textarea rows={3} required placeholder="Describe yourself in a few words..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-gray-50/50 border-[1.5px] border-gray-100 px-3.5 py-2.5 rounded-xl focus:border-red-400 focus:bg-white outline-none transition-all resize-none text-xs" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-right">
              <h3 className="text-lg md:text-xl font-black text-gray-800 mb-5">I am looking for...</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3">
                {['Men', 'Women', 'Everyone'].map((opt) => (
                  <label key={opt} className="cursor-pointer group relative">
                    <input type="radio" name="interested_in" className="peer hidden" 
                      checked={formData.interestedIn === opt} onChange={() => setFormData({...formData, interestedIn: opt})} />
                    <div className="p-3.5 md:p-5 border-[1.5px] border-gray-100 rounded-xl md:rounded-2xl text-center font-bold text-gray-500 transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 peer-checked:shadow-sm hover:border-red-200 text-xs">
                      <Users className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-1.5" />
                      {opt}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-right">
              <h3 className="text-lg md:text-xl font-black text-gray-800 mb-5">Lifestyle & Goals</h3>
              <div className="space-y-5 md:space-y-6">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-2">Relationship Goal</p>
                  <div className="flex flex-wrap gap-2 md:gap-2.5">
                    {['Long-term', 'Casual', 'Marriage', 'Friendship'].map((g) => (
                      <label key={g} className="cursor-pointer">
                        <input type="radio" name="dating_goal" className="peer hidden"
                          checked={formData.datingGoal === g} onChange={() => setFormData({...formData, datingGoal: g})} />
                        <div className="px-3.5 py-1.5 md:px-4 md:py-2 border-[1.5px] border-gray-100 rounded-full font-bold text-gray-500 text-[11px] md:text-xs transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 peer-checked:shadow-sm">
                          {g}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-2">Main Hobby</p>
                  <select value={formData.hobbyGoal} onChange={e => setFormData({...formData, hobbyGoal: e.target.value})}
                    className="w-full bg-gray-50 border-[1.5px] border-gray-100 px-3.5 py-2.5 rounded-xl md:rounded-2xl outline-none focus:border-rose-400 font-bold text-[11px] md:text-xs cursor-pointer">
                    <option>Outdoor & Travel</option>
                    <option>Gaming & Tech</option>
                    <option>Cooking & Food</option>
                    <option>Arts & Music</option>
                    <option>Fitness & Gym</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in-right">
              <h3 className="text-lg md:text-xl font-black text-gray-800 mb-3 md:mb-4">Preferences</h3>
              <p className="text-[11px] md:text-xs text-gray-500 mb-5">Select all that apply to your search:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {['Men', 'Women', 'Non Binary', 'Transgender'].map((opt) => (
                  <label key={opt} className="cursor-pointer">
                    <input type="checkbox" className="peer hidden"
                      checked={formData.preferences.includes(opt)} onChange={() => togglePreference(opt)} />
                    <div className="p-2.5 md:p-3 border-[1.5px] border-gray-100 rounded-xl font-bold text-gray-500 text-[11px] md:text-xs text-center transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 peer-checked:shadow-sm">
                      {opt}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 md:mt-8 pt-5 border-t border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={handlePrev} className="px-5 py-2 md:py-2.5 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all text-[11px] md:text-xs">
                Back
              </button>
            ) : <div />}
            
            {step < 4 ? (
              <button type="submit" className="px-6 py-2 md:py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-xl shadow-md shadow-red-200 hover:shadow-red-400 transition-all transform hover:-translate-y-1 flex items-center text-[11px] md:text-xs">
                Continue <ArrowRight className="w-3.5 h-3.5 ml-2 shrink-0" />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="px-6 py-2 md:py-2.5 bg-gradient-to-r from-rose-600 to-red-500 text-white font-black rounded-xl shadow-md transition-all transform hover:-translate-y-1 flex items-center text-[11px] md:text-xs disabled:opacity-70 disabled:transform-none">
                {loading ? "Saving..." : "Complete Profile"} {!loading && <Check className="w-3.5 h-3.5 ml-2 shrink-0" />}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}