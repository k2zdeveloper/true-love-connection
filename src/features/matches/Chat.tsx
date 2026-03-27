import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Send, Image as ImageIcon, Mic, MoreVertical, ChevronLeft, 
  Smile, ShieldAlert, Ban, Loader2, Play, Heart 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function Chat() {
  const { matchId } = useParams(); // ID of the person we are chatting with
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Conversation & Load recipient profile
  useEffect(() => {
    if (!matchId || !user) return;

    async function initChat() {
      // Get recipient profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', matchId).single();
      setRecipient(prof);

      // Find or Create Conversation
      const participants = [user.id, matchId].sort();
      const { data: conv, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1', participants[0])
        .eq('participant_2', participants[1])
        .maybeSingle();

      if (conv) {
        setConversationId(conv.id);
        loadMessages(conv.id);
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ participant_1: participants[0], participant_2: participants[1] })
          .select().single();
        setConversationId(newConv.id);
      }
    }
    initChat();
  }, [matchId, user]);

  // 2. Realtime Subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (user && payload.new.sender_id !== user.id) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  const loadMessages = async (cid: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, stories(*)')
      .eq('conversation_id', cid)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSendMessage = async (e?: React.FormEvent, mediaData?: {url: string, type: string}) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !mediaData) || !conversationId || !user?.id) return;

    const messageObj = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage,
      media_url: mediaData?.url || null,
      media_type: mediaData?.type || null,
    };

    // Optimistic UI update
    setMessages(prev => [...prev, { ...messageObj, id: Date.now().toString(), created_at: new Date().toISOString() }]);
    setNewMessage("");
    scrollToBottom();

    const { error } = await supabase.from('messages').insert(messageObj);
    if (error) console.error("Message failed to send:", error);

    await supabase.from('conversations').update({ 
      last_message_text: mediaData ? `Sent a ${mediaData.type}` : newMessage,
      last_message_at: new Date().toISOString()
    }).eq('id', conversationId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSending(true);

    try {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const path = `chat/${conversationId}/${Date.now()}_${file.name}`;
      await supabase.storage.from('stories').upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path);
      
      handleSendMessage(undefined, { url: publicUrl, type });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white md:bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 md:hidden">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="relative">
            <img src={recipient?.profile_pic_url || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="ml-3">
            <h3 className="font-black text-gray-900 text-sm">{recipient?.display_name || "Loading..." }</h3>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-tight">Active Now</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-red-500 transition-colors"><ShieldAlert className="w-5 h-5" /></button>
          <button className="text-gray-400 hover:text-gray-900"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[75%] group relative ${isMe ? 'order-1' : 'order-2'}`}>
                
                {/* Story Context (Instagram Style) */}
                {msg.media_type === 'story_reaction' && (
                  <div className="mb-2 p-2 bg-gray-100 rounded-2xl border border-gray-200 opacity-80">
                    <p className="text-[10px] font-bold text-gray-500 mb-1 italic">Replied to your story</p>
                    <div className="h-20 w-14 bg-gray-300 rounded-lg overflow-hidden">
                       <img src={msg.stories?.media_url} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                <div className={`px-4 py-2.5 rounded-[1.5rem] text-sm font-medium shadow-sm ${
                  isMe ? 'bg-gradient-to-br from-red-600 to-rose-500 text-white rounded-tr-none' 
                       : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.media_url && (
                    <div className="mb-2 rounded-xl overflow-hidden shadow-inner">
                      {msg.media_type === 'video' ? (
                        <video src={msg.media_url} controls className="max-h-60 w-full" />
                      ) : (
                        <img src={msg.media_url} className="max-h-60 w-full object-cover" />
                      )}
                    </div>
                  )}
                  {msg.content}
                </div>
                
                {/* Reactions (Mini Emojis) */}
                {msg.reaction && (
                  <div className={`absolute -bottom-2 ${isMe ? '-left-1' : '-right-1'} bg-white shadow-md rounded-full px-1.5 py-0.5 text-xs border border-gray-100`}>
                    {msg.reaction}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-red-100 transition-all">
          <label className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors">
            <ImageIcon className="w-5 h-5" />
            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
          </label>
          <input 
            type="text" 
            placeholder="Message..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          {newMessage.trim() || sending ? (
            <button type="submit" disabled={sending} className="text-red-500 font-black text-sm px-2 animate-in zoom-in">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
            </button>
          ) : (
            <div className="flex items-center space-x-3 text-gray-400">
              <Mic className="w-5 h-5 hover:text-red-500 cursor-pointer" />
              <Smile className="w-5 h-5 hover:text-red-500 cursor-pointer" />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}