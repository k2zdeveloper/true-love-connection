import { Link, useNavigate } from "react-router-dom";
import { Heart, Compass, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealtimeProvider"; // Ensure path matches your setup

export function Navbar() {
  const { user, signOut } = useAuth();
  const { likesCount } = useRealtime(); 
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/"); 
  };

  return (
    <nav className="sticky top-0 z-50 transition-all duration-300 animate-slide-down bg-white/70 backdrop-blur-xl border-b border-red-500/15 shadow-[0_4px_25px_rgba(220,38,38,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Height reduced by 20%: h-20 (80px) -> h-16 (64px) */}
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
            {/* Icon Container: 
              Base size reduced by 20% (w-12->w-[38px]), but hover scales up by 10% (scale-110). 
            */}
            <div className="relative w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-red-600 via-rose-500 to-red-500 flex items-center justify-center shadow-[0_3px_10px_rgba(225,29,72,0.3)] group-hover:shadow-[0_5px_15px_rgba(225,29,72,0.4)] transition-all duration-300 group-hover:scale-110">
              <Heart className="text-white w-4 h-4 animate-pulse fill-current" />
            </div>
            <span className="text-xl font-extrabold tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-rose-500 to-red-500 bg-[length:200%_auto] animate-text-shine">
              True Love C
            </span>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-5">
            {user ? (
              <>
                {/* Desktop Links - Scaled down text */}
                <div className="hidden md:flex items-center space-x-6 mr-4">
                  <Link to="/discover" className="relative text-gray-500 font-bold text-sm flex items-center space-x-1.5 hover:text-red-500 transition-colors">
                    <Compass className="w-4 h-4" /><span>Discover</span>
                  </Link>
                </div>

                <div className="w-px h-6 bg-gray-200 hidden md:block mx-1.5" />

                <div className="flex items-center space-x-3 sm:space-x-5">
                  {/* Realtime Notification Icon - Scaled down */}
                  <Link to="/likes" className="relative text-gray-400 hover:text-red-500 transition-colors duration-300 p-1.5 group">
                    <div className="absolute inset-0 bg-red-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 -z-10" />
                    <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    
                    {/* Dynamic Red Badge - Positioned tightly */}
                    {likesCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center bg-red-600 rounded-full border-2 border-white shadow-sm text-[8px] font-black text-white animate-in zoom-in">
                        {likesCount > 9 ? '9+' : likesCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile / Logout - Scaled down */}
                  <div className="relative flex items-center pl-1.5 sm:pl-3 border-l border-gray-100">
                    <button onClick={handleLogout} className="group flex items-center space-x-2 bg-white border border-gray-100 hover:border-red-200 p-1 pr-3 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95">
                      <LogOut className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 ml-1.5 md:ml-0" />
                      <span className="text-xs font-bold text-gray-600 group-hover:text-red-500 transition-colors hidden sm:block">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
               <></>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}