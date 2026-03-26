import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { X, Loader2, HeartCrack } from "lucide-react";

interface Story {
  id: string;
  image_url: string;
}

export function StoryViewer() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
const duration = 5000; // 5 seconds per story
  
  // ENTERPRISE FIX: Explicitly allow null as the initial state
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedProgressRef = useRef<number>(0);
  // 1. Fetch active stories
  useEffect(() => {
    async function fetchStories() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, image_url')
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;
        setStories(data || []);
      } catch (err) {
        console.error("Failed to load stories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, [userId]);

  // 2. High-Performance Progress Animation
  useEffect(() => {
    if (stories.length === 0 || loading) return;

    const animate = (timestamp: number) => {
      if (isPaused) {
        // Log the current time so when we unpause, we don't jump ahead
        startTimeRef.current = timestamp - (pausedProgressRef.current / 100) * duration;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = (elapsed / duration) * 100;

      if (currentProgress >= 100) {
        handleNext();
      } else {
        setProgress(currentProgress);
        pausedProgressRef.current = currentProgress;
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentIndex, isPaused, stories, loading]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetProgress();
    } else {
      closeViewer();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetProgress();
    } else {
      resetProgress(); // Just restart current story if at beginning
    }
  };

  const resetProgress = () => {
    setProgress(0);
    pausedProgressRef.current = 0;
    startTimeRef.current = null;
  };

  const closeViewer = () => {
    navigate("/discover");
  };

  // Prevent background scrolling while modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white">
        <HeartCrack className="w-12 h-12 text-gray-500 mb-4" />
        <h2 className="text-xl font-bold">Story Expired</h2>
        <button onClick={closeViewer} className="mt-6 px-6 py-2 bg-gray-800 rounded-full text-sm font-bold">Go Back</button>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-black select-none flex items-center justify-center">
      
      {/* Progress Bars Container */}
      <div className="absolute top-2 left-2 right-2 flex space-x-1 z-50">
        {stories.map((story, idx) => (
          <div key={story.id} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all ease-linear"
              style={{ 
                width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%`,
                // Remove transition duration if jumping backwards to prevent smooth "rewind" visual glitch
                transitionDuration: idx === currentIndex && !isPaused && progress > 0 ? '50ms' : '0ms' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Image Area with Touch/Mouse Interaction */}
      <div 
        className="relative w-full h-full max-w-lg md:h-[90vh] md:rounded-[2rem] overflow-hidden"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <img 
          src={currentStory.image_url} 
          alt="Story" 
          className="w-full h-full object-cover md:object-contain bg-black"
          draggable={false}
        />
        
        {/* Navigation Overlays */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-40" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-2/3 z-40" onClick={handleNext} />
      </div>

      {/* Close Button */}
      <button 
        onClick={closeViewer}
        className="absolute top-6 right-4 z-50 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}