import { useEffect, useRef } from 'react';
import { Bot, User, MessageSquare, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chatStore';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { NumericalAnalysisDisplay } from './NumericalAnalysisDisplay';
import { CategoricalAnalysisDisplay } from './CategoricalAnalysisDisplay';

export const ChatWindow = () => {
  const { messages, currentChatId, addMessage } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentChatId) return;

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`messages:${currentChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChatId}`
        },
        (payload) => {
          addMessage(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChatId]);
  const { signOut, user } = useAuth();
  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateMessageWidth = (text: string) => {
    const charCount = text.length;
    
    if (charCount < 30) return 'max-w-[300px]';
    if (charCount < 80) return 'max-w-[400px]';
    if (charCount < 150) return 'max-w-[500px]';
    if (charCount < 250) return 'max-w-[600px]';
    return 'max-w-[700px]';
  };

  const renderMessageContent = (message: any) => {
    try {
      const parsed = JSON.parse(message.text);
      if (parsed.type === 'numerical_analysis') {
        return <NumericalAnalysisDisplay data={parsed} />;
      }
      if (parsed.type === 'categorical_analysis') {
        return <CategoricalAnalysisDisplay data={parsed} />;
      }
    } catch {
      // Not JSON or not an analysis, render as text
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>;
  };

  if (!currentChatId) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900 text-gray-300">
  <div className="text-center max-w-md mx-auto p-8">
    <div className="relative mb-6">
      <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl"></div>
      <MessageSquare className="relative mx-auto h-20 w-20 text-gray-400" />
    </div>

    <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
      Start a Conversation
    </h2>

    <p className="text-muted-foreground leading-relaxed mb-6">
      Begin a new chat to explore insights, ask questions, or collaborate with me.  
      Your next idea is just one message away.
    </p>

   
  </div>
</div>

    );
  }

  return (
    <ScrollArea className="h-full bg-gradient-to-b from-zinc-800 to-zinc-900 text-gray-300 " ref={scrollRef}>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-3xl font-semibold mb-2">How Can I help you?</h3>
        
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4 group animate-in fade-in duration-300",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                message.role === 'user' 
                  ? "bg-gray-500 border-primary/20" 
                  : " border-primary/10"
              )}>
                {message.role === 'user' ? (
                     user?.email?.charAt(0).toUpperCase()
                ) : (
                 <img src="./AutoInsight.png" alt="" />
                )}
              </div>

              {/* Message Content */}
              <div className={cn(
                "flex-1 space-y-2",
                message.text.includes('numerical_analysis') ? 'max-w-full' : calculateMessageWidth(message.text)
              )}>
                <div className="flex items-center gap-3 mb-1">
                 
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
                
                <div className={cn(
                  "rounded-2xl p-4 transition-all duration-200 ",
                  message.role === 'user' 
                    ? cn(
                        " bg-gradient-to-b from-zinc-700 to-zinc-800  text-primary-foreground",
                        "rounded-br-md shadow-primary/10 border-primary/30"
                      )
                    : cn(
                        " bg-gradient-to-b from-zinc-800 to-zinc-700 text-card-foreground",
                        "rounded-bl-md shadow-sm border-border/50"
                      )
                )}>
                  {renderMessageContent(message)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};