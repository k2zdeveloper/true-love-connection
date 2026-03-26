import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, Phone, Video, Info, Smile, Send, ArrowLeft, Loader2, HeartCrack, Sparkles, Heart } from "lucide-react";

interface Profile {
  id: string;
  display_name: string;
  profile_pic_url: string;
}

interface Match {
  id: string;
  other_user: Profile;
  last_message?: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Matches List
  useEffect(() => {
    if (!userId) return;
    async function fetchMatches() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id, updated_at, user1:user1_id(id, display_name, profile_pic_url), user2:user2_id(id, display_name, profile_pic_url)')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const formatted = data.map((m: any) => ({
          id: m.id,
          updated_at: m.updated_at,
          other_user: m.user1.id === userId ? m.user2 : m.user1
        }));
        setMatches(formatted);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoadingMatches(false);
      }
    }
    fetchMatches();
  }, [userId]);

  // Fetch Messages for active match
  useEffect(() => {
    if (!matchId || !userId) return;
    async function fetchMessages() {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        scrollToBottom();
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();

    // Set up Realtime subscription for new messages
    const channel = supabase.channel(`messages-${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, userId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !matchId || !userId) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: userId,
        message: messageText
      });
      if (error) throw error;
      
      // Update match timestamp
      await supabase.from('matches').update({ updated_at: new Date().toISOString() }).eq('id', matchId);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const activeMatch = matches.find(m => m.id === matchId);

  return (
    <div className="max-w-6xl mx-auto md:py-6 px-0 md:px-4 h-[calc(100vh-64px)] md:h-[calc(100vh-100px)]">
      <div className="bg-white/80 backdrop-blur-xl border border-red-500/10 md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full relative">
        
        {/* Left Sidebar: Match List (Hides on mobile if a chat is active) */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white ${matchId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-5 flex justify-between items-center border-b border-gray-50">
            <h1 className="text-lg md:text-xl font-black tracking-tight text-gray-900">Messages</h1>
            <Edit className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500 transition-colors" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingMatches ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
            ) : matches.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-xs font-medium">No matches yet. Keep swiping!</div>
            ) : (
              matches.map((m) => (
                <Link 
                  key={m.id} 
                  to={`/chat/${m.id}`} 
                  className={`flex items-center px-4 py-3 hover:bg-red-50/50 transition-all border-l-4 ${matchId === m.id ? 'border-red-500 bg-red-50/30' : 'border-transparent'}`}
                >
                  <div className="relative shrink-0">
                    <img src={m.other_user.profile_pic_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 border-2 border-white rounded-full" />
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <h3 className="font-black text-gray-900 text-xs md:text-sm truncate">{m.other_user.display_name}</h3>
                    <p className="text-[10px] md:text-[11px] text-gray-500 font-medium truncate mt-0.5">Tap to chat...</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className={`flex-1 flex flex-col bg-gray-50/30 ${!matchId ? 'hidden md:flex' : 'flex'}`}>
          {activeMatch ? (
            <>
              {/* Chat Header */}
              <div className="p-3 md:p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center space-x-3">
                  <button onClick={() => navigate('/chat')} className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img src={activeMatch.other_user.profile_pic_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-red-50" />
                  <div>
                    <h4 className="font-black text-gray-900 text-xs md:text-sm">{activeMatch.other_user.display_name}</h4>
                    <p className="text-[9px] md:text-[10px] font-bold text-green-500 uppercase tracking-widest">Active Now</p>
                  </div>
                </div>
                <div className="flex space-x-4 text-gray-400 mr-2">
                  <Phone className="w-4 h-4 cursor-pointer hover:text-red-500 transition-colors" />
                  <Video className="w-4 h-4 cursor-pointer hover:text-red-500 transition-colors" />
                  <Info className="w-4 h-4 cursor-pointer hover:text-red-500 transition-colors" />
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col space-y-3 custom-scrollbar">
                {loadingMessages ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-600">You matched with {activeMatch.other_user.display_name}!</p>
                    <p className="text-[10px] text-gray-400">Send a message to start the spark.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 text-[11px] md:text-xs rounded-[1.25rem] ${
                        isMine 
                          ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white self-end rounded-br-sm shadow-md' 
                          : 'bg-white border border-gray-100 text-gray-800 self-start rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.message}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 md:p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-3 border border-gray-200 rounded-full px-3 py-1.5 md:px-4 md:py-2 bg-gray-50/50 focus-within:bg-white focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-50 transition-all">
                  <Smile className="w-4 h-4 md:w-5 md:h-5 text-gray-400 cursor-pointer hover:text-red-500 shrink-0" />
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent border-none focus:outline-none text-[11px] md:text-xs font-medium text-gray-700 py-1.5"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="text-red-500 font-black text-[11px] md:text-xs hover:text-red-600 disabled:opacity-50 transition-colors p-1.5">
                    <Send className="w-4 h-4 md:hidden" />
                    <span className="hidden md:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 animate-bounce shadow-inner">
                <Heart className="w-8 h-8 md:w-10 md:h-10 text-red-500 fill-current" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1.5">Your Inbox</h2>
              <p className="text-[11px] md:text-xs text-gray-500 font-medium max-w-xs">Select a match on the left to start sparking chemistry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}