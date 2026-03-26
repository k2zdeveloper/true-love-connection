import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";

interface MatchData {
  id: string;
  other_user: {
    id: string;
    display_name: string;
    profile_pic_url: string;
  };
  created_at: string;
}

export function Matches() {
  const { user } = useAuth();
  const userId = useMemo(() => user?.id, [user?.id]);
  
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchMatches() {
      try {
        // Fetch matches where the current user is either user1 or user2
        const { data, error } = await supabase
          .from('matches')
          .select(`
            id, 
            created_at,
            user1:user1_id(id, display_name, profile_pic_url),
            user2:user2_id(id, display_name, profile_pic_url)
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map the data to easily isolate the "other" user
        if (data) {
          const formattedMatches = data.map((match: any) => {
            const isUser1 = match.user1.id === userId;
            return {
              id: match.id,
              created_at: match.created_at,
              other_user: isUser1 ? match.user2 : match.user1
            };
          });
          setMatches(formattedMatches);
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center mb-6 md:mb-8">
        <Link to="/discover" className="p-2 mr-3 bg-white rounded-full shadow-sm border border-gray-100 hover:border-red-200 transition-colors group">
          <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
        </Link>
        <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Your Matches</h2>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-red-500/10 p-4 md:p-6 rounded-[1.5rem] shadow-xl min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            <p className="text-[11px] font-bold text-gray-500">Loading your connections...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <Heart className="w-6 h-6 text-red-300" />
            </div>
            <h3 className="text-sm font-black text-gray-800 mb-1">It's quiet here</h3>
            <p className="text-[11px] text-gray-500">Keep swiping to find your spark!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {matches.map((match) => (
              <Link 
                key={match.id} 
                to={`/chat/${match.other_user.id}`}
                className="group flex items-center p-3 bg-white border-[1.5px] border-gray-50 hover:border-red-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-red-400 transition-colors shrink-0">
                  <img 
                    src={match.other_user.profile_pic_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"} 
                    alt={match.other_user.display_name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <h4 className="text-xs font-black text-gray-900 group-hover:text-red-600 transition-colors truncate">
                    {match.other_user.display_name}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                    Tap to start chatting
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-500 transition-colors shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}