import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Radar, MapPin } from "lucide-react";

interface NearbyUser {
  id: string;
  display_name: string;
  profile_pic_url: string;
  latitude: number;
  longitude: number;
}

export function RadarMap() {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNearby() {
      try {
        // Fetch profiles that have locations set (Assuming you add lat/long to profiles eventually)
        // For this demo, we just fetch random active users to populate the radar
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, profile_pic_url')
          .limit(8);

        if (error) throw error;
        
        // Randomly assign positions around the radar circle for UI demo purposes
        const positionedUsers = data.map((u: any) => ({
          ...u,
          // Generate random X/Y percentages between 10% and 90% to keep them in bounds
          left: Math.random() * 80 + 10,
          top: Math.random() * 80 + 10,
          delay: Math.random() * 2 // Random animation delay for floating effect
        }));

        setUsers(positionedUsers);
      } catch (err) {
        console.error("Error fetching nearby users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNearby();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link to="/discover" className="p-2 mr-3 bg-white rounded-full shadow-sm border border-gray-100 hover:border-red-200 transition-colors group">
            <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
          </Link>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Smart Pulse</h2>
        </div>
        <div className="flex items-center text-[10px] md:text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full animate-pulse">
          <Radar className="w-3.5 h-3.5 mr-1.5" /> Scanning...
        </div>
      </div>

      {/* The Advanced CSS Radar UI */}
      <div className="relative w-full aspect-square max-w-[500px] mx-auto bg-white rounded-full shadow-2xl border-8 border-red-50 flex items-center justify-center overflow-hidden">
        
        {/* Radar Rings */}
        <div className="absolute inset-0 border border-red-100 rounded-full scale-[0.25]" />
        <div className="absolute inset-0 border border-red-100 rounded-full scale-[0.5]" />
        <div className="absolute inset-0 border border-red-100 rounded-full scale-[0.75]" />
        
        {/* Sweeping Radar Arm */}
        <div className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-gradient-to-br from-red-500/40 to-transparent origin-top-left animate-radar-spin rounded-br-full border-r-2 border-red-400" />

        {/* Center User (You) */}
        <div className="absolute z-30 w-12 h-12 md:w-16 md:h-16 bg-red-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(225,29,72,0.6)] flex items-center justify-center">
          <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>

        {/* Floating Nearby Users */}
        {!loading && users.map((u: any, i) => (
          <Link 
            key={u.id} 
            to={`/profile/${u.id}`}
            className="absolute z-20 transition-transform hover:scale-110 hover:z-40 group animate-float"
            style={{ 
              left: `${u.left}%`, 
              top: `${u.top}%`,
              animationDelay: `${u.delay}s`
            }}
          >
            <div className="relative">
              <img 
                src={u.profile_pic_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?random=${i}`} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-lg object-cover ring-2 ring-red-100 group-hover:ring-red-500 transition-all"
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {u.display_name}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-10">
        <p className="text-[11px] md:text-xs text-gray-500 font-medium">Found <span className="font-black text-red-500">{users.length}</span> singles in your area.</p>
      </div>
    </div>
  );
}