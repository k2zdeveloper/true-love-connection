import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IdCard, Camera, ShieldCheck, Lock, CheckCheck, Hourglass, AlertTriangle, ArrowRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import { useAuth } from "@/contexts/AuthContext";

type KYCStatus = 'unverified' | 'pending' | 'approved' | 'rejected' | 'loading';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function KYC() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<KYCStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    async function fetchKYCStatus() {
      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('kyc_status')
          .eq('id', userId!) 
          .single();

        if (dbError) throw dbError;
        setStatus((data?.kyc_status as KYCStatus) || 'unverified');
      } catch (err) {
        console.error("Error fetching KYC status:", err);
        setError("We couldn't retrieve your current verification status.");
        setStatus('unverified');
      }
    }

    fetchKYCStatus();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (idPreview) URL.revokeObjectURL(idPreview);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [idPreview, selfiePreview]);

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
      setError("Invalid file type. Please upload a high-quality JPG, PNG, or WebP image.");
      e.target.value = ''; 
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File is too large. Documents must be under 5MB to ensure processing.");
      e.target.value = ''; 
      return;
    }

    setFile(file);
    if (currentPreview) URL.revokeObjectURL(currentPreview);
    setPreview(URL.createObjectURL(file));
  };

  const clearIdFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdFile(null);
    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdPreview(null);
    if (idInputRef.current) idInputRef.current.value = '';
  };

  const clearSelfieFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelfieFile(null);
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null);
    if (selfieInputRef.current) selfieInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError("You must be logged in to submit verification.");
      return;
    }
    
    if (!idFile || !selfieFile) {
      setError("Both a Government ID and a Live Selfie are required for verification.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const idPath = `${userId}/id_${timestamp}.${idFile.name.split('.').pop()}`;
      const selfiePath = `${userId}/selfie_${timestamp}.${selfieFile.name.split('.').pop()}`;

      const { error: idError } = await supabase.storage
        .from('kyc_documents')
        .upload(idPath, idFile, { cacheControl: '3600', upsert: false });

      if (idError) throw idError;

      const { error: selfieError } = await supabase.storage
        .from('kyc_documents')
        .upload(selfiePath, selfieFile, { cacheControl: '3600', upsert: false });

      if (selfieError) throw selfieError;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
          id_path: idPath,
          selfie_path: selfiePath
        })
        .eq('id', userId);

      if (dbError) throw dbError;

      setStatus('pending');
      setIdFile(null);
      setSelfieFile(null);
      
    } catch (err: any) {
      console.error("KYC Submission Snag:", err);
      setError(err.message || "We encountered an issue uploading your documents. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#fafaf9]">
        <div className="animate-pulse text-red-500 font-bold text-sm">Warming things up...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <div className="text-center mb-6 md:mb-8 animate-slide-up">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-1.5">
          Identity <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">Verification</span>
        </h2>
        <p className="text-gray-500 font-medium text-[11px] md:text-xs">To keep our nation safe, we need to ensure you're really you.</p>
      </div>

      <div className="setup-card p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl animate-fade-in relative overflow-hidden bg-white/90 backdrop-blur-xl border border-red-100/50">
        <div className="absolute -top-10 -right-10 w-20 md:w-28 h-20 md:h-28 bg-red-100 rounded-full opacity-50 blur-2xl animate-pulse" />

        {error && (
          <div className="mb-5 p-3 bg-red-50 border-l-[3px] border-red-500 text-red-700 text-[11px] font-bold rounded-xl flex items-start animate-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {status === 'approved' && (
          <div className="text-center py-6 md:py-8 animate-in fade-in-right">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl shadow-lg shadow-green-100">
              <CheckCheck className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1.5">You're Verified!</h3>
            <p className="text-[11px] md:text-xs text-gray-500 mb-6 font-medium px-4">Your identity has been confirmed. Welcome to the inner circle.</p>
            <button onClick={() => navigate('/discover', { replace: true })} className="group relative inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-full text-[11px] md:text-xs font-black shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1">
              Explore Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:scale-110 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center py-6 md:py-8 animate-in fade-in-right">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl status-pulse">
              <Hourglass className="w-7 h-7 md:w-8 md:h-8 animate-pulse" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1.5">Review in Progress</h3>
            <p className="text-[11px] md:text-xs text-gray-500 font-medium max-w-sm mx-auto px-4 mb-6">Our team (and our smart AI) is matching your photos. <br/> This usually takes less than 24 hours.</p>
            <button onClick={() => navigate('/discover', { replace: true })} className="group relative inline-flex items-center justify-center bg-gradient-to-r from-rose-500 to-red-600 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-full text-[11px] md:text-xs font-black shadow-lg hover:shadow-rose-500/30 transition-all duration-300 transform hover:-translate-y-1">
              Explore Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:scale-110 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>
        )}

        {status === 'rejected' && (
          <div className="text-center py-6 md:py-8 animate-in fade-in-right">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl animate-bounce">
              <X className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1.5">Submission Issue</h3>
            <p className="text-[11px] md:text-xs text-gray-500 font-medium mb-5 px-4">We couldn't verify your last submission. This is usually due to blurry photos. Please try again.</p>
            <button onClick={() => setStatus('unverified')} className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 transition-colors transform active:scale-95 text-[11px] md:text-xs">
              Retry Verification
            </button>
          </div>
        )}

        {(status === 'unverified') && (
          <form onSubmit={handleUpload} className="space-y-5 md:space-y-6 animate-in fade-in-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              
              <div className="space-y-2.5 md:space-y-3">
                <label className="flex items-center text-sm md:text-base font-black text-gray-800 ml-1">
                  <span className="w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-md flex items-center justify-center mr-2 text-[10px] md:text-xs">1</span>
                  Government ID
                </label>
                <div 
                  className={`file-drop-area group h-[140px] md:h-[180px] rounded-[1.5rem] md:rounded-[2rem] border-[1.5px] ${idPreview ? 'border-red-300 bg-red-50/50' : 'border-dashed border-gray-200'} p-3 text-center cursor-pointer transition-all hover:scale-[1.01] flex flex-col items-center justify-center`}
                  onClick={() => idInputRef.current?.click()}
                >
                  <input type="file" ref={idInputRef} name="id_photo" accept="image/jpeg,image/png,image/webp" required className="hidden" 
                    onChange={(e) => handleFileChange(e, setIdFile, setIdPreview, idPreview)} />
                  
                  {idPreview ? (
                    <div className="relative w-full h-full group">
                      <img src={idPreview} alt="ID Preview" loading="lazy" className="w-full h-full object-cover rounded-xl md:rounded-[1.5rem] border border-red-100 shadow-inner" />
                      <button onClick={clearIdFile} type="button"
                        className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur-sm text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-110 shadow-sm">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 md:space-y-2 p-3 md:p-4 text-gray-400 group-hover:text-red-600 transition-colors">
                      <IdCard className="w-6 h-6 md:w-8 md:h-8 mx-auto" />
                      <p className="text-[11px] md:text-xs font-bold text-gray-500 group-hover:text-red-600">Click to upload ID</p>
                      <p className="text-[8px] md:text-[9px]">Passport, License or National ID (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 md:space-y-3">
                <label className="flex items-center text-sm md:text-base font-black text-gray-800 ml-1">
                  <span className="w-5 h-5 md:w-6 md:h-6 bg-rose-500 text-white rounded-md flex items-center justify-center mr-2 text-[10px] md:text-xs">2</span>
                  Live Selfie
                </label>
                <div 
                  className={`file-drop-area group h-[140px] md:h-[180px] rounded-[1.5rem] md:rounded-[2rem] border-[1.5px] ${selfiePreview ? 'border-rose-300 bg-rose-50/50' : 'border-dashed border-gray-200'} p-3 text-center cursor-pointer transition-all hover:scale-[1.01] flex flex-col items-center justify-center`}
                  onClick={() => selfieInputRef.current?.click()}
                >
                  <input type="file" ref={selfieInputRef} name="selfie" accept="image/jpeg,image/png,image/webp" required capture="user" className="hidden"
                    onChange={(e) => handleFileChange(e, setSelfieFile, setSelfiePreview, selfiePreview)} />
                  
                  {selfiePreview ? (
                    <div className="relative w-full h-full group">
                      <img src={selfiePreview} alt="Selfie Preview" loading="lazy" className="w-full h-full object-cover rounded-xl md:rounded-[1.5rem] border border-rose-100 shadow-inner" />
                      <button onClick={clearSelfieFile} type="button"
                        className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur-sm text-rose-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-110 shadow-sm">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 md:space-y-2 p-3 md:p-4 text-gray-400 group-hover:text-rose-600 transition-colors">
                      <Camera className="w-6 h-6 md:w-8 md:h-8 mx-auto" />
                      <p className="text-[11px] md:text-xs font-bold text-gray-500 group-hover:text-rose-600">Take/Upload Selfie</p>
                      <p className="text-[8px] md:text-[9px]">Ensure your face is clearly visible (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-3 md:pt-4">
              <button 
                type="submit" 
                disabled={submitting} 
                className="group relative w-full inline-flex items-center justify-center bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white font-black py-3 md:py-4 rounded-xl md:rounded-2xl shadow-lg hover:shadow-red-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-lg text-[11px] md:text-xs tracking-wide"
              >
                {submitting ? (
                  <>
                    <Hourglass className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin shrink-0" />
                    <span>Verifying Secure Connection...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" />
                    <span>Submit for Secure Verification</span>
                    <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                  </>
                )}
              </button>
              <p className="flex justify-center items-center text-[8px] md:text-[9px] text-gray-400 mt-3 font-bold text-center px-2">
                <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 text-red-400 shrink-0" /> 
                Your data is encrypted in transit and stored in our private, secure vault.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}