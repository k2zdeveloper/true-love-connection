import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Users, ArrowRight, Check, AlertCircle, 
  IdCard, Camera, ShieldCheck, Lock, Hourglass, X 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile Data
  const [formData, setFormData] = useState({
    name: "", age: "", occupation: "", bio: "",
    interestedIn: "Everyone", datingGoal: "Long-term", hobbyGoal: "Outdoor & Travel",
    preferences: [] as string[]
  });

  // KYC Data
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (idPreview) URL.revokeObjectURL(idPreview);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [idPreview, selfiePreview]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  // --- Step 4: Save Profile Data ---
  const handleSaveProfile = async () => {
    if (!user) { setError("Session expired. Please log in again."); return; }
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
          kyc_status: 'unverified' // Initialize KYC status
        });

      if (dbError) throw dbError;
      setStep(5); // Move to KYC step
    } catch (err: any) {
      console.error("Profile save error:", err);
      setError("We hit a snag saving your profile. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  // --- Step 5: File Handlers & Submit KYC ---
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void,
    currentPreview: string | null
  ) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      e.target.value = ''; 
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File is too large. Documents must be under 5MB.");
      e.target.value = ''; 
      return;
    }

    setFile(file);
    if (currentPreview) URL.revokeObjectURL(currentPreview);
    setPreview(URL.createObjectURL(file));
  };

  const clearFile = (e: React.MouseEvent, type: 'id' | 'selfie') => {
    e.stopPropagation();
    if (type === 'id') {
      setIdFile(null);
      if (idPreview) URL.revokeObjectURL(idPreview);
      setIdPreview(null);
      if (idInputRef.current) idInputRef.current.value = '';
    } else {
      setSelfieFile(null);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      setSelfiePreview(null);
      if (selfieInputRef.current) selfieInputRef.current.value = '';
    }
  };

  const handleKYCSubmit = async () => {
    if (!user) { setError("You must be logged in."); return; }
    if (!idFile || !selfieFile) { setError("Both Government ID and Live Selfie are required."); return; }

    setLoading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const idPath = `${user.id}/id_${timestamp}.${idFile.name.split('.').pop()}`;
      const selfiePath = `${user.id}/selfie_${timestamp}.${selfieFile.name.split('.').pop()}`;

      const { error: idError } = await supabase.storage.from('kyc_documents').upload(idPath, idFile);
      if (idError) throw idError;

      const { error: selfieError } = await supabase.storage.from('kyc_documents').upload(selfiePath, selfieFile);
      if (selfieError) throw selfieError;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
          id_path: idPath,
          selfie_path: selfiePath
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      navigate("/discover", { replace: true });
    } catch (err: any) {
      console.error("KYC Submission Snag:", err);
      setError(err.message || "Issue uploading documents. Please try again.");
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
          {step === 5 ? "Identity " : "Build Your "} 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">
            {step === 5 ? "Verification" : "Identity"}
          </span>
        </h2>
        <p className="text-gray-500 font-medium text-[11px] md:text-xs">
          {step === 5 ? "To keep our nation safe, we need to ensure you're really you." : "Let the nation know who you are."}
        </p>
      </div>

      <div className="mb-8 md:mb-10 relative max-w-lg mx-auto px-2">
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gray-200 -translate-y-1/2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
        <div className="relative flex justify-between">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl border-[1.5px] flex items-center justify-center text-[11px] md:text-xs font-black transition-all duration-500 z-10 ${
              num <= step 
                ? 'bg-gradient-to-r from-red-500 to-rose-500 border-transparent shadow-[0_0_12px_rgba(225,29,72,0.4)] text-white' 
                : 'bg-white border-gray-200 text-gray-400'
            }`}>
              {num === 5 && num <= step ? <ShieldCheck className="w-4 h-4" /> : num}
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

        {/* Step 1: Basics */}
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

        {/* Step 2: Interested In */}
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

        {/* Step 3: Lifestyle */}
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

        {/* Step 4: Preferences */}
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

        {/* Step 5: KYC */}
        {step === 5 && (
           <div className="space-y-5 md:space-y-6 animate-in fade-in-right">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
               <div className="space-y-2.5 md:space-y-3">
                 <label className="flex items-center text-sm md:text-base font-black text-gray-800 ml-1">
                   <IdCard className="w-5 h-5 mr-2 text-red-500" />
                   Government ID
                 </label>
                 <div 
                   className={`group h-[140px] md:h-[180px] rounded-[1.5rem] md:rounded-[2rem] border-[1.5px] ${idPreview ? 'border-red-300 bg-red-50/50' : 'border-dashed border-gray-200'} p-3 text-center cursor-pointer transition-all hover:scale-[1.01] flex flex-col items-center justify-center`}
                   onClick={() => idInputRef.current?.click()}
                 >
                   <input type="file" ref={idInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" 
                     onChange={(e) => handleFileChange(e, setIdFile, setIdPreview, idPreview)} />
                   
                   {idPreview ? (
                     <div className="relative w-full h-full group">
                       <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover rounded-xl md:rounded-[1.5rem] border border-red-100 shadow-inner" />
                       <button onClick={(e) => clearFile(e, 'id')} type="button"
                         className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur-sm text-red-500 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm">
                         <X className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   ) : (
                     <div className="space-y-1.5 p-3 text-gray-400 group-hover:text-red-600 transition-colors">
                       <p className="text-[11px] md:text-xs font-bold">Click to upload ID</p>
                       <p className="text-[8px] md:text-[9px]">Passport, License or National ID (Max 5MB)</p>
                     </div>
                   )}
                 </div>
               </div>

               <div className="space-y-2.5 md:space-y-3">
                 <label className="flex items-center text-sm md:text-base font-black text-gray-800 ml-1">
                   <Camera className="w-5 h-5 mr-2 text-rose-500" />
                   Live Selfie
                 </label>
                 <div 
                   className={`group h-[140px] md:h-[180px] rounded-[1.5rem] md:rounded-[2rem] border-[1.5px] ${selfiePreview ? 'border-rose-300 bg-rose-50/50' : 'border-dashed border-gray-200'} p-3 text-center cursor-pointer transition-all hover:scale-[1.01] flex flex-col items-center justify-center`}
                   onClick={() => selfieInputRef.current?.click()}
                 >
                   <input type="file" ref={selfieInputRef} accept="image/jpeg,image/png,image/webp" capture="user" className="hidden"
                     onChange={(e) => handleFileChange(e, setSelfieFile, setSelfiePreview, selfiePreview)} />
                   
                   {selfiePreview ? (
                     <div className="relative w-full h-full group">
                       <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover rounded-xl md:rounded-[1.5rem] border border-rose-100 shadow-inner" />
                       <button onClick={(e) => clearFile(e, 'selfie')} type="button"
                         className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur-sm text-rose-500 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm">
                         <X className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   ) : (
                     <div className="space-y-1.5 p-3 text-gray-400 group-hover:text-rose-600 transition-colors">
                       <p className="text-[11px] md:text-xs font-bold">Take/Upload Selfie</p>
                       <p className="text-[8px] md:text-[9px]">Ensure your face is clearly visible</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
             <p className="flex justify-center items-center text-[8px] md:text-[9px] text-gray-400 mt-3 font-bold text-center px-2">
               <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 text-red-400 shrink-0" /> 
               Your data is encrypted and stored securely.
             </p>
           </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 md:mt-8 pt-5 border-t border-gray-100">
          {step > 1 && step < 5 ? (
            <button type="button" onClick={handlePrev} className="px-5 py-2 md:py-2.5 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all text-[11px] md:text-xs">
              Back
            </button>
          ) : <div />}
          
          {step < 4 && (
            <button onClick={handleNext} className="px-6 py-2 md:py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-xl shadow-md hover:shadow-red-400 transition-all transform hover:-translate-y-1 flex items-center text-[11px] md:text-xs">
              Continue <ArrowRight className="w-3.5 h-3.5 ml-2 shrink-0" />
            </button>
          )}

          {step === 4 && (
            <button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 md:py-2.5 bg-gradient-to-r from-rose-600 to-red-500 text-white font-black rounded-xl shadow-md transition-all transform hover:-translate-y-1 flex items-center text-[11px] md:text-xs disabled:opacity-70 disabled:transform-none">
              {loading ? "Saving Profile..." : "Save Profile & Continue"} {!loading && <Check className="w-3.5 h-3.5 ml-2 shrink-0" />}
            </button>
          )}

          {step === 5 && (
            <button onClick={handleKYCSubmit} disabled={loading} className="px-6 py-2 md:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-black rounded-xl shadow-md transition-all transform hover:-translate-y-1 flex items-center text-[11px] md:text-xs disabled:opacity-70 disabled:transform-none">
              {loading ? <><Hourglass className="w-3.5 h-3.5 mr-2 animate-spin" /> Uploading...</> : <><ShieldCheck className="w-3.5 h-3.5 mr-2" /> Submit Verification</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}