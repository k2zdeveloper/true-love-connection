import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Image as ImageIcon, X, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export function StoryUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError("");

    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !file) return;

    setLoading(true);
    setError("");

    try {
      // 1. Secure upload path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      // 3. Insert into Database with 24h Expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          expires_at: expiresAt.toISOString()
        });

      if (dbError) throw dbError;

      // Success, go back to dashboard
      navigate("/discover", { replace: true });
    } catch (err: any) {
      console.error("Story upload error:", err);
      setError("Failed to post your story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <Link to="/discover" className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:border-red-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Add a Story</h2>
        <div className="w-8" /> {/* Spacer */}
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-red-500/10 p-5 md:p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden">
        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border-l-[3px] border-red-500 text-red-700 text-[10px] font-bold rounded-xl animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-5">
          <div 
            className={`relative group w-full aspect-[9/16] max-h-[60vh] rounded-[1.5rem] border-[1.5px] overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all ${
              preview ? 'border-transparent shadow-md' : 'border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            {preview ? (
              <>
                <img src={preview} alt="Story Preview" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                <button 
                  onClick={clearFile} 
                  type="button"
                  className="absolute top-4 right-4 p-1.5 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center p-6 text-gray-400 group-hover:text-red-500 transition-colors">
                <ImageIcon className="w-10 h-10 mx-auto mb-3" />
                <p className="text-[11px] font-bold text-gray-600 mb-1">Tap to select photo</p>
                <p className="text-[9px]">Will disappear in 24 hours</p>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={!file || loading}
            className="w-full text-white font-black py-3 rounded-xl shadow-lg hover:shadow-red-500/40 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center bg-gradient-to-r from-red-600 to-rose-500 disabled:opacity-50 disabled:hover:translate-y-0 text-xs tracking-wide"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> Posting...</>
            ) : (
              <><Camera className="w-4 h-4 mr-2 shrink-0" /> Post to Story</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}