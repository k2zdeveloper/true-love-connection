import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, UploadCloud, Loader2, Image as ImageIcon, Video, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function StoryUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Robust file checking: Max 15MB
    if (selected.size > 15 * 1024 * 1024) {
      alert("File is too large. Max size is 15MB.");
      return;
    }

    const isVideo = selected.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file || !user || !mediaType) return;
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(fileName);

      // 2. Insert into DB
      const { error: dbError } = await supabase.from('stories').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
      });

      if (dbError) throw dbError;

      // Success, go back to dashboard
      navigate('/discover');
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to post story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={() => navigate(-1)} className="text-white hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-white font-bold text-sm">New Story</h2>
          <div className="w-6" />
        </div>

        {/* Preview Area */}
        <div className="w-full aspect-[9/16] bg-black flex items-center justify-center relative">
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:text-white transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 border border-gray-700">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="font-semibold text-sm">Tap to select Image/Video</p>
              <p className="text-xs text-gray-600 mt-2">Max 15MB</p>
            </div>
          ) : mediaType === 'video' ? (
            <video src={preview} controls className="w-full h-full object-contain" />
          ) : (
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*,video/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </div>

        {/* Footer Actions */}
        {preview && (
          <div className="p-4 bg-gray-900">
            <button 
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              {loading ? "Posting Story..." : "Post to My Story"}
            </button>
            <button 
              onClick={() => { setFile(null); setPreview(null); }}
              className="w-full mt-3 text-gray-400 font-semibold py-2 hover:text-white transition-colors text-sm"
            >
              Retake
            </button>
          </div>
        )}
      </div>
    </div>
  );
}