import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, PlayCircle, X } from "lucide-react";
import { useRealtime } from "@/contexts/RealtimeProvider";

export function MatchModal() {
  const { activeMatch, clearMatch } = useRealtime();

  // Prevent background scrolling when modal is open (Mobile UX)
  useEffect(() => {
    if (activeMatch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeMatch]);

  if (!activeMatch) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Animated Backdrop Blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={clearMatch}
      />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden flex flex-col items-center text-center">
        
        {/* Background ambient glows */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-pink-500/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/20 rounded-full blur-[3rem]" />

        <button 
          onClick={clearMatch}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-black text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 mb-2 drop-shadow-sm mt-4">
          It's a Match!
        </h2>
        <p className="text-gray-300 font-medium mb-10 text-sm md:text-base">
          You and <span className="text-white font-bold">{activeMatch.display_name}</span> have liked each other.
        </p>

        {/* Overlapping Profile Pictures */}
        <div className="relative flex items-center justify-center h-40 w-full mb-12">
          {/* We use a placeholder for the logged-in user here, but you could pass it via context */}
          <div className="absolute right-[55%] w-32 h-32 rounded-full border-4 border-black bg-gray-800 shadow-2xl z-10 animate-in slide-in-from-right-8 duration-700 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300" 
              alt="You" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute left-[55%] w-32 h-32 rounded-full border-4 border-black bg-gray-800 shadow-2xl z-20 animate-in slide-in-from-left-8 duration-700 delay-150 overflow-hidden">
            <img 
              src={activeMatch.profile_pic_url || "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300"} 
              alt={activeMatch.display_name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Call to Actions */}
        <div className="w-full space-y-4 relative z-30">
          <Link 
            to={`/chat/${activeMatch.id}`}
            onClick={clearMatch}
            className="w-full flex items-center justify-center py-4 md:py-5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black rounded-2xl shadow-lg hover:shadow-pink-500/50 transition-all duration-300 active:scale-95"
          >
            <MessageSquare className="w-5 h-5 mr-3 fill-current" />
            Send a Message
          </Link>
          <button 
            onClick={clearMatch}
            className="w-full flex items-center justify-center py-4 md:py-5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-white font-black rounded-2xl transition-all duration-300 active:scale-95"
          >
            <PlayCircle className="w-5 h-5 mr-3" />
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}