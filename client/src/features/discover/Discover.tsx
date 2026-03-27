import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Heart, MapPin, X, Star, SlidersHorizontal, PlayCircle, Plus, 
  MessageSquare, Crown, ChevronRight, Unlock, Camera, Map, 
  Zap, Check, Eye
} from "lucide-react";

interface Profile {
  id: string;
  display_name: string;
  age: number;
  occupation: string;
  bio: string;
  hobby_goal: string;
  activity_goal: string;
  profile_pic_url?: string;
}

export function Discover() {
  const { user } = useAuth();
  const userId = user?.id;
  
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [matchQueue, setMatchQueue] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function loadDashboardData() {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId) 
          .single();
        
        if (profileError) throw profileError;
        if (profileData) setMyProfile(profileData);

        const { data: queueData, error: queueError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', userId)
          .limit(10);

        if (queueError) throw queueError;
        if (queueData) setMatchQueue(queueData);

      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [userId]); 

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!userId || matchQueue.length === 0 || swipeDirection) return;

    const currentProfile = matchQueue[0];
    setSwipeDirection(direction);

    try {
      const { error: swipeError } = await supabase.from('swipes').insert({
        swiper_id: userId,
        swiped_id: currentProfile.id,
        action: direction === 'right' ? 'like' : 'pass'
      });

      if (swipeError) throw swipeError;

      setTimeout(() => {
        setMatchQueue(prev => prev.slice(1));
        setSwipeDirection(null);
      }, 400);

    } catch (err) {
      console.error("Failed to record swipe:", err);
      setSwipeDirection(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#fafaf9]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-bounce mb-4 shadow-[0_0_20px_rgba(225,29,72,0.4)]">
          <Heart className="w-8 h-8 text-red-500 fill-current" />
        </div>
        <div className="text-red-500 font-bold tracking-widest uppercase text-xs animate-pulse">Finding your next match...</div>
      </div>
    );
  }

  const currentMatch = matchQueue[0];

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-8 bg-[#fafaf9] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* ================= LEFT SIDEBAR (Hidden on Mobile) ================= */}
        <div className="lg:col-span-1 hidden md:block">
          <div className="sticky top-24 space-y-6">
            
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:-translate-y-1 transition-transform duration-300 border border-red-50 relative group">
              <div className="h-32 bg-gradient-to-br from-red-600 via-rose-500 to-red-500 animate-gradient-bg opacity-90 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400')] bg-cover mix-blend-overlay opacity-30" />
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/20 rounded-full blur-xl animate-pulse" />
              </div>
              
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2">
                <div className="relative animate-float">
                  <img src={myProfile?.profile_pic_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'} 
                       alt="Profile"
                       loading="lazy"
                       className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl bg-white relative z-10" />
                  <div className="absolute bottom-1 right-1 z-20">
                    <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white" />
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-14 pb-6 px-6 text-center mt-2">
                <h3 className="font-extrabold text-xl text-gray-800 tracking-tight">{myProfile?.display_name || 'Your Name'}</h3>
                <p className="text-xs text-gray-500 font-medium mb-4">{myProfile?.occupation || 'Add occupation'}</p>
                
                <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl py-2 px-4 mb-4 border border-red-100">
                  <Crown className="w-4 h-4 text-red-500 animate-bounce" />
                  <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600">Free Member</span>
                </div>
                
                <div className="flex justify-between items-center px-2 bg-gray-50 rounded-2xl p-3">
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-black text-rose-600">0</p>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Matches</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <Link to="/setup" className="text-[11px] md:text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center group/edit">
                    Edit <ChevronRight className="w-3 h-3 ml-1 group-hover/edit:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border border-red-50 flex items-center justify-between group cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="w-10 h-10 bg-white rounded-full border-2 border-red-100 overflow-hidden relative z-10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500 blur-[1px]" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center z-20 shadow-sm border border-white animate-pulse">3+</div>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-extrabold text-gray-800">Likes You</p>
                  <p className="text-[10px] md:text-[11px] text-red-500 font-semibold">Upgrade to see who</p>
                </div>
              </div>
              <Unlock className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-red-500 transition-colors" />
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border border-gray-100">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3.5 ml-2">Navigation</h4>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/matches" className="group flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-gray-700 hover:text-red-600 font-bold text-xs md:text-sm">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-sm shrink-0"><Heart className="w-4 h-4" /></div>
                    <span>My Matches</span>
                  </Link>
                </li>
                <li>
                  <Link to="/subscription" className="group flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-colors text-gray-700 hover:text-rose-600 font-bold relative overflow-hidden text-xs md:text-sm">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-200 to-transparent rounded-full -mr-6 -mt-6 opacity-50" />
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white flex items-center justify-center group-hover:scale-110 shadow-md transition-transform shrink-0"><Crown className="w-4 h-4" /></div>
                    <span>Upgrade to Premium</span>
                  </Link>
                </li>
                <li>
                  {/* FIXED: Now routes securely to the Story Upload component */}
                  <Link to="/story/upload" className="group flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-colors text-gray-700 hover:text-rose-500 font-bold text-xs md:text-sm">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shrink-0"><Camera className="w-4 h-4" /></div>
                    <span>Add Story</span>
                  </Link>
                </li>
                <li>
                  <Link to="/radar" className="group flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-gray-700 hover:text-red-600 font-bold text-xs md:text-sm">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shrink-0"><Map className="w-4 h-4" /></div>
                    <span>Radar Map</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ================= MAIN SWIPE AREA ================= */}
        <div className="lg:col-span-2 flex flex-col items-center w-full">
          <div className="w-full max-w-md flex justify-between items-center mb-4 md:mb-6 px-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600 tracking-tight">Discover</h2>
            </div>
            <button className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:shadow-md transition-all border border-gray-50 hover:border-red-100">
              <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <div className="w-full max-w-md relative flex flex-col items-center justify-center">
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 mt-[-40px] md:mt-[-60px]">
              <div className="w-48 h-48 md:w-64 md:h-64 border-[1.5px] border-red-300/40 rounded-full absolute animate-radar-pulse" />
              <div className="w-48 h-48 md:w-64 md:h-64 border-[1.5px] border-rose-400/30 rounded-full absolute animate-radar-pulse [animation-delay:1.5s]" />
              <div className="w-48 h-48 md:w-64 md:h-64 border-[1.5px] border-red-300/20 rounded-full absolute animate-radar-pulse [animation-delay:0.75s]" />
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-full absolute blur-md" />
            </div>

            <div className="relative w-full max-w-[95%] sm:max-w-full aspect-[3/4] z-10 [perspective:1000px]">
              {currentMatch ? (
                <div 
                  className={`absolute inset-0 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_15px_40px_rgba(225,29,72,0.15)] border-2 border-white overflow-hidden 
                    ${swipeDirection === 'right' ? 'animate-swipe-right' : ''} 
                    ${swipeDirection === 'left' ? 'animate-swipe-left' : ''}
                  `}
                >
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentMatch.profile_pic_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600'})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                    <div className="flex items-end justify-between">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold">{currentMatch.display_name}, {currentMatch.age}</h2>
                        <p className="text-white/80 flex items-center mt-1 text-sm md:text-base">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Nearby
                        </p>
                      </div>
                      <div className="bg-red-500 rounded-full p-1.5 md:p-2"><Check className="w-3 h-3 md:w-4 md:h-4 text-white" /></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                      {currentMatch.hobby_goal && <span className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs md:text-sm font-medium">{currentMatch.hobby_goal}</span>}
                      {currentMatch.activity_goal && <span className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs md:text-sm font-medium">{currentMatch.activity_goal}</span>}
                    </div>
                    <p className="mt-2 md:mt-3 text-white/90 line-clamp-2 text-sm md:text-base">{currentMatch.bio || "Looking for a great connection!"}</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center shadow-lg border border-red-100">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 md:w-10 md:h-10 text-red-300" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">You're all caught up!</h3>
                  <p className="text-xs md:text-sm text-gray-500">Check back later or expand your search filters.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center items-center space-x-4 md:space-x-6 mt-6 md:mt-10 z-20 w-full px-2">
              <button 
                onClick={() => handleSwipe('left')}
                disabled={!currentMatch || swipeDirection !== null}
                className="group relative w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-[0_8px_25px_rgba(225,29,72,0.15)] flex items-center justify-center hover:-translate-y-2 transition-all duration-300 border border-rose-50 hover:border-rose-200 hover:shadow-rose-200/50 disabled:opacity-50 disabled:hover:translate-y-0 shrink-0"
              >
                <div className="absolute inset-0 bg-rose-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
                <X className="w-6 h-6 md:w-8 md:h-8 text-rose-400 relative z-10 group-hover:text-rose-600 transition-colors" />
              </button>
              
              <button className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full shadow-[0_8px_25px_rgba(225,29,72,0.1)] flex items-center justify-center hover:-translate-y-2 transition-all duration-300 border border-red-50 hover:border-red-200 group relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-100 to-transparent scale-0 group-hover:scale-100 transition-transform duration-300" />
                <Star className="w-5 h-5 md:w-6 md:h-6 text-red-400 relative z-10 group-hover:text-red-600 transition-colors group-hover:rotate-[72deg] duration-500 fill-current" />
              </button>

              <button 
                onClick={() => handleSwipe('right')}
                disabled={!currentMatch || swipeDirection !== null}
                className="group relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-500 via-rose-500 to-red-600 rounded-full shadow-[0_15px_35px_rgba(225,29,72,0.4)] flex items-center justify-center hover:-translate-y-2 hover:animate-heartbeat transition-all duration-300 border-4 border-white disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:animate-none shrink-0"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300" />
                <div className="absolute -inset-2 bg-red-500 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity -z-10" />
                <Heart className="w-7 h-7 md:w-10 md:h-10 text-white relative z-10 drop-shadow-md fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR (Hidden on Mobile) ================= */}
        <div className="lg:col-span-1 hidden md:block">
          <div className="sticky top-24 space-y-6">
            
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border border-red-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -z-10 -mr-10 -mt-10" />
              <h4 className="font-black text-gray-800 mb-4 flex items-center text-sm md:text-base">
                <PlayCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 shrink-0" /> Hot Stories
              </h4>
              
              <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                
                {/* FIXED: Links directly to the StoryUpload component */}
                <Link to="/story/upload" className="flex flex-col items-center group">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full border-[1.5px] border-dashed border-red-400 flex items-center justify-center group-hover:bg-red-50 transition-colors relative shadow-sm">
                    <img src={myProfile?.profile_pic_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'} alt="Add Story" loading="lazy" className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 lg:w-5 lg:h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md border-2 border-white transform translate-x-3 translate-y-3">
                        <Plus className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] lg:text-[9px] font-bold text-gray-500 mt-1.5 uppercase tracking-wide">Add</span>
                </Link>

                {/* NEW: Allows testing the viewer by opening the logged-in user's own story */}
                {userId && (
                  <Link to={`/story/${userId}`} className="flex flex-col items-center group">
                    <div className="bg-gradient-to-tr from-red-500 via-rose-500 to-red-600 p-[2px] rounded-full transition-transform duration-300 group-hover:scale-110 shadow-md">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-cover bg-center border-2 border-white" style={{ backgroundImage: `url(${myProfile?.profile_pic_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'})` }} />
                    </div>
                    <span className="text-[9px] lg:text-[10px] font-bold text-gray-700 mt-1.5 truncate w-12 lg:w-14 text-center group-hover:text-red-600 transition-colors">My Story</span>
                  </Link>
                )}

                {/* Mock Stories (Linked to dummy IDs so the viewer opens and says "Expired") */}
                {[1, 2, 3, 4].map((num) => (
                  <Link key={num} to={`/story/dummy-user-${num}`} className="flex flex-col items-center group">
                    <div className="bg-gradient-to-tr from-red-500 via-rose-500 to-red-600 p-[2px] rounded-full transition-transform duration-300 group-hover:scale-110 shadow-md">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-cover bg-center border-2 border-white" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&random=${num}')` }} />
                    </div>
                    <span className="text-[9px] lg:text-[10px] font-bold text-gray-700 mt-1.5 truncate w-12 lg:w-14 text-center group-hover:text-red-600 transition-colors">User {num}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border border-red-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-gray-800 flex items-center text-sm md:text-base">
                  <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-red-500 mr-2 shrink-0" /> Chats
                </h4>
                <Link to="/chat" className="text-[9px] lg:text-[10px] font-black bg-red-50 text-red-600 px-2.5 py-1 rounded-full hover:bg-red-100 transition-colors">See all</Link>
              </div>
              
              <div className="space-y-2 custom-scrollbar overflow-y-auto max-h-[250px] pr-2">
                <div className="text-center py-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-50 to-rose-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-300 border border-red-100">
                    <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <p className="text-[11px] lg:text-xs text-gray-500 font-bold">It's quiet here...</p>
                  <p className="text-[9px] lg:text-[10px] text-gray-400 mt-0.5">Keep swiping to get matches!</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ================= POWER UPS (BOTTOM) ================= */}
      <div className="mt-10 md:mt-12 mb-8">
        <div className="flex items-center justify-between mb-5 px-2">
          <h3 className="text-lg md:text-xl font-black text-gray-800 flex items-center">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 fill-current shrink-0" /> Power Ups
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="group bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(225,29,72,0.15)] transition-all duration-500 transform hover:-translate-y-1.5 border border-red-50 relative overflow-hidden z-10">
            <div className="absolute -right-10 -top-10 w-24 h-24 bg-red-500/10 rounded-full group-hover:scale-[2.5] transition-transform duration-700 -z-10" />
            
            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-50 rounded-xl flex items-center justify-center mb-3 text-red-500 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-rose-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <MessageSquare className="w-4 h-4 group-hover:animate-bounce" />
            </div>
            <h3 className="font-extrabold text-base md:text-lg text-gray-800 mb-1.5 group-hover:text-red-600 transition-colors">Priority DMs</h3>
            <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">Jump to the top of their inbox. Your messages get seen 3x faster.</p>
          </div>
          
          <div className="group bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(225,29,72,0.15)] transition-all duration-500 transform hover:-translate-y-1.5 border border-rose-50 relative overflow-hidden z-10 delay-75">
            <div className="absolute -right-10 -top-10 w-24 h-24 bg-rose-500/10 rounded-full group-hover:scale-[2.5] transition-transform duration-700 -z-10" />
            
            <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-red-50 rounded-xl flex items-center justify-center mb-3 text-rose-500 group-hover:bg-gradient-to-br group-hover:from-rose-500 group-hover:to-red-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Eye className="w-4 h-4 group-hover:animate-pulse" />
            </div>
            <h3 className="font-extrabold text-base md:text-lg text-gray-800 mb-1.5 group-hover:text-rose-600 transition-colors">See Who Likes You</h3>
            <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed mb-3">No more guessing. See everyone who swiped right on you instantly.</p>
            <Link to="/subscription" className="inline-flex items-center text-rose-500 text-[10px] md:text-[11px] font-bold hover:text-rose-700 transition-colors group-hover:translate-x-1 transform duration-300">
              Unlock Now <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          
          <div className="group bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(225,29,72,0.3)] transition-all duration-500 transform hover:-translate-y-1.5 border border-gray-700 relative overflow-hidden z-10 delay-150 sm:col-span-2 md:col-span-1">
            <div className="absolute -right-10 -top-10 w-24 h-24 bg-red-500/20 rounded-full group-hover:scale-[3] transition-transform duration-700 blur-md -z-10" />
            
            <div className="w-10 h-10 bg-gray-800/50 backdrop-blur-md rounded-xl flex items-center justify-center mb-3 text-red-400 group-hover:text-white border border-gray-600 transition-all duration-300">
              <Zap className="w-4 h-4 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)] group-hover:animate-pulse fill-current" />
            </div>
            <h3 className="font-extrabold text-base md:text-lg text-white mb-1.5 flex items-center">
              Super Boost <span className="ml-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider shrink-0">Hot</span>
            </h3>
            <p className="text-[11px] md:text-xs text-gray-400 font-medium leading-relaxed">Be the top profile in your area for 30 minutes. Get up to 10x more matches.</p>
          </div>
        </div>
      </div>

    </div>
  );
}