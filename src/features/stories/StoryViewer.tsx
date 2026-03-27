import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Heart, Eye, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Viewer {
  id: string;
  display_name: string;
  profile_pic_url: string;
  reaction?: string;
}

export function StoryViewer() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  // Analytics State
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const activeStory = stories[currentIndex];
  const isMyStory = currentUser?.id === activeStory?.user_id;

  // 1. Fetch valid stories
  useEffect(() => {
    async function fetchStories() {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) console.error("Error fetching stories:", error);
      else setStories(data || []);
      
      setLoading(false);
    }
    fetchStories();
  }, [userId]);

  // 2. Record View (if not my own story)
  useEffect(() => {
    if (stories.length === 0 || !currentUser || isMyStory) return;
    
    const recordView = async () => {
      const currentStoryId = stories[currentIndex].id;
      // Unique constraint in DB prevents duplicates safely
      await supabase.from('story_views').insert({
        story_id: currentStoryId,
        viewer_id: currentUser.id
      });
    };
    recordView();
  }, [currentIndex, stories, currentUser, isMyStory]);

  // 3. Auto-advance logic (5 seconds for images)
  useEffect(() => {
    if (stories.length === 0 || isPaused || showAnalytics) return;

    if (activeStory?.media_type === 'video') return; 

    const timer = setTimeout(() => handleNext(), 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, stories, isPaused, showAnalytics, activeStory]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnalytics(false); // Close analytics on next
    } else {
      navigate(-1); 
    }
  }, [currentIndex, stories.length, navigate]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnalytics(false);
    }
  };

  const handleReaction = async (type: 'love' | 'haha' | 'wow') => {
    if (!currentUser || stories.length === 0) return;
    
    await supabase.from('story_reactions').insert({
      story_id: activeStory.id,
      reactor_id: currentUser.id,
      reaction_type: type
    });
    
    handleNext();
  };

  // 4. Fetch Analytics (Only for story owner)
  const loadAnalytics = async () => {
    if (!isMyStory || !activeStory) return;
    setLoadingAnalytics(true);
    setShowAnalytics(true);

    try {
      // Fetch Views joined with Profiles
      const { data: viewsData } = await supabase
        .from('story_views')
        .select('viewer_id, profiles!story_views_viewer_id_fkey(id, display_name, profile_pic_url)')
        .eq('story_id', activeStory.id)
        .order('viewed_at', { ascending: false });

      // Fetch Reactions
      const { data: reactionsData } = await supabase
        .from('story_reactions')
        .select('reactor_id, reaction_type')
        .eq('story_id', activeStory.id);

      // Merge them together
      const mergedViewers: Viewer[] = (viewsData || []).map((v: any) => {
        const reaction = reactionsData?.find(r => r.reactor_id === v.viewer_id)?.reaction_type;
        return {
          id: v.profiles.id,
          display_name: v.profiles.display_name,
          profile_pic_url: v.profiles.profile_pic_url,
          reaction: reaction
        };
      });

      setViewers(mergedViewers);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const reactionEmojis: Record<string, string> = { love: '❤️', haha: '😂', wow: '😲' };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  
  if (stories.length === 0) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
      <p className="text-gray-400 font-bold">Story expired or unavailable.</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-gray-800 rounded-full font-bold hover:bg-gray-700 transition-colors">Go Back</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col sm:p-4">
      <div className="relative w-full h-full max-w-lg mx-auto bg-gray-900 sm:rounded-[2rem] overflow-hidden flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex space-x-1 p-3 pt-4 sm:pt-6 bg-gradient-to-b from-black/60 to-transparent">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-linear ${idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full duration-5000' : 'w-0'}`} 
                style={idx === currentIndex && !isPaused && !showAnalytics && activeStory.media_type !== 'video' ? { transitionDuration: '5s' } : {}}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 z-20 px-4 flex justify-between items-center text-white">
          <div className="flex items-center">
            <span className="ml-2 font-bold text-sm shadow-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
              {new Date(activeStory.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          <button onClick={() => navigate(-1)} className="p-2 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Media Container */}
        <div 
          className="flex-1 relative"
          onPointerDown={() => !showAnalytics && setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        >
          {/* Invisible click zones for Prev/Next */}
          {!showAnalytics && (
            <>
              <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
              <div className="absolute inset-y-0 right-0 w-2/3 z-10" onClick={handleNext} />
            </>
          )}

          {activeStory.media_type === 'video' ? (
            <video 
              src={activeStory.media_url} 
              autoPlay={!showAnalytics} 
              playsInline 
              muted={false}
              onEnded={handleNext}
              className="w-full h-full object-cover" 
            />
          ) : (
            <img src={activeStory.media_url} alt="Story" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Bottom Panel: Analytics (My Story) OR Reactions (Others) */}
        <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 z-30 ${showAnalytics ? 'translate-y-0 h-2/3' : 'translate-y-0'}`}>
          
          {isMyStory ? (
            // --- MY STORY ANALYTICS ---
            <div className={`bg-gray-900 rounded-t-[2rem] flex flex-col ${showAnalytics ? 'h-full border-t border-gray-800' : 'bg-gradient-to-t from-black/90 to-transparent pt-10'}`}>
              
              {!showAnalytics ? (
                <button onClick={loadAnalytics} className="flex flex-col items-center justify-center p-4 text-white hover:text-red-400 transition-colors">
                  <ChevronUp className="w-6 h-6 animate-bounce" />
                  <div className="flex items-center font-bold text-sm mt-1">
                    <Eye className="w-4 h-4 mr-1.5" /> Viewers
                  </div>
                </button>
              ) : (
                <div className="flex-1 flex flex-col p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-red-500" /> {viewers.length} Views
                    </h3>
                    <button onClick={() => setShowAnalytics(false)} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {loadingAnalytics ? (
                      <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
                    ) : viewers.length === 0 ? (
                      <div className="text-center text-gray-500 py-10 font-medium">No views yet. Check back soon!</div>
                    ) : (
                      viewers.map((viewer) => (
                        <div key={viewer.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-2xl border border-gray-700">
                          <div className="flex items-center">
                            <img src={viewer.profile_pic_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'} className="w-10 h-10 rounded-full object-cover border border-gray-600" alt="avatar" />
                            <span className="ml-3 font-bold text-gray-200">{viewer.display_name}</span>
                          </div>
                          {viewer.reaction && (
                            <div className="text-xl bg-gray-700 p-1.5 rounded-full shadow-inner">
                              {reactionEmojis[viewer.reaction]}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // --- OTHERS STORY REACTIONS ---
            <div className="p-4 pb-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center space-x-6">
              <button onClick={() => handleReaction('wow')} className="flex flex-col items-center group">
                <div className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-md border border-gray-700 flex items-center justify-center text-2xl group-hover:scale-125 transition-all">😲</div>
              </button>
              <button onClick={() => handleReaction('love')} className="flex flex-col items-center group">
                <div className="w-14 h-14 rounded-full bg-red-500/80 backdrop-blur-md border border-red-400 flex items-center justify-center group-hover:scale-125 transition-all transform -translate-y-2">
                  <Heart className="w-6 h-6 text-white fill-current" />
                </div>
              </button>
              <button onClick={() => handleReaction('haha')} className="flex flex-col items-center group">
                <div className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-md border border-gray-700 flex items-center justify-center text-2xl group-hover:scale-125 transition-all">😂</div>
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}