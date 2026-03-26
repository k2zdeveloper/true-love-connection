import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Strict typing for our matching system
interface MatchProfile {
  id: string;
  display_name: string;
  profile_pic_url: string;
}

interface RealtimeContextType {
  likesCount: number;
  activeMatch: MatchProfile | null;
  clearMatch: () => void;
  resetLikes: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [activeMatch, setActiveMatch] = useState<MatchProfile | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    // PERFORMANCE: Fetch initial unseen likes count on mount
    const fetchInitialData = async () => {
      try {
        const { count, error } = await supabase
          .from('swipes')
          .select('*', { count: 'exact', head: true })
          .eq('swiped_id', userId)
          .eq('action', 'like');
        
        if (!error && count) setLikesCount(count);
      } catch (err) {
        console.error('Failed to fetch initial likes:', err);
      }
    };

    fetchInitialData();

    // ROBUSTNESS: Setup Supabase Realtime Channels with strict filtering
    // We only listen to events specifically targeted at the logged-in user
    
    const channel = supabase.channel(`user-notifications-${userId}`)
      // 1. Listen for incoming Likes
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'swipes', filter: `swiped_id=eq.${userId}` },
        (payload) => {
          if (payload.new.action === 'like') {
            setLikesCount((prev) => prev + 1);
          }
        }
      )
      // 2. Listen for Matches (Scenario A: User is user1)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `user1_id=eq.${userId}` },
        async (payload) => handleNewMatch(payload.new.user2_id)
      )
      // 3. Listen for Matches (Scenario B: User is user2)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `user2_id=eq.${userId}` },
        async (payload) => handleNewMatch(payload.new.user1_id)
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error("Realtime WebSocket Error:", err);
          // Implement exponential backoff or retry logic here in a massive scale app
        }
      });

    // Helper to fetch the other user's profile data for the Match Modal
    const handleNewMatch = async (matchedUserId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, profile_pic_url')
          .eq('id', matchedUserId)
          .single();

        if (error) throw error;
        if (data) setActiveMatch(data as MatchProfile);
      } catch (err) {
        console.error('Failed to fetch match profile:', err);
      }
    };

    // MEMORY LEAK PREVENTION: Always cleanup websockets on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const clearMatch = () => setActiveMatch(null);
  const resetLikes = () => setLikesCount(0);

  return (
    <RealtimeContext.Provider value={{ likesCount, activeMatch, clearMatch, resetLikes }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};