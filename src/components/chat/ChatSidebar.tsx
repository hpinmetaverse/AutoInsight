import { useEffect, useState } from 'react';
import { Plus, MessageSquare, LogOut, Loader2, Trash2, Edit2, Check, X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chatStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export const ChatSidebar = () => {
  const { chats, setChats, currentChatId, setCurrentChatId, reset } = useChatStore();
  const { signOut, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  useEffect(() => {
    if (user) loadChats();
  }, [user]);

  const loadChats = async () => {
    setIsLoadingChats(true);
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) setChats(data);
    setIsLoadingChats(false);
  };

  const createNewChat = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, title: 'New Chat' })
      .select()
      .single();
    setLoading(false);
    if (!error && data) {
      setChats([data, ...chats]);
      setCurrentChatId(data.id);
      reset();
    }
  };

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (data) useChatStore.getState().setMessages(data as any);
  };

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    const { data, error } = await supabase
      .from('chats')
      .update({ title: newTitle })
      .eq('id', chatId)
      .select()
      .single();

    if (!error && data) setChats(chats.map((c) => (c.id === chatId ? data : c)));
    setEditingChatId(null);
  };

  const deleteChat = async (chatId: string) => {
    await supabase.from('messages').delete().eq('chat_id', chatId);
    await supabase.from('chats').delete().eq('id', chatId);
    setChats(chats.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId('');
      useChatStore.getState().setMessages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === 'Enter') {
      updateChatTitle(chatId, tempTitle);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-r bg-gradient-to-b from-zinc-800 to-zinc-900 text-gray-300  border-border bg-sidebar/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold  text-white bg-clip-text text-transparent">
            Chat History
          </h1>
          <span className="text-xs bg-gradient-to-b from-zinc-500 to-zinc-700 text-muted-foreground text-gray-300 bg-muted px-2 py-1 rounded-full">
            {chats.length} chats
          </span>
        </div>
        <Button 
          onClick={createNewChat} 
          className="w-full h-11 bg-gradient-to-b from-zinc-500 to-zinc-700 hover:bg-gray-600  transition-all duration-200 shadow-lg "
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {isLoadingChats ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : chats.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            // Chat items
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl p-3 transition-all duration-200 cursor-pointer border",
                  currentChatId === chat.id
                    ? " border-gray-400  text-gray-300   shadow-lg shadow-primary/5"
                    : "border-transparent hover:bg-gradient-to-b from-zinc-700 to-zinc-800 text-gray-300  hover:border-border/50"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 flex-shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>

                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => selectChat(chat.id)}
                >
                  {editingChatId === chat.id ? (
                    <Input
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, chat.id)}
                      onBlur={() => updateChatTitle(chat.id, tempTitle)}
                      autoFocus
                      className="h-7 text-sm bg-background"
                      placeholder="Chat title..."
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate text-foreground">
                        {chat.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(chat.updated_at)}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className={cn(
                  "flex items-center gap-1 transition-opacity ",
                  editingChatId === chat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {editingChatId === chat.id ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-green-500/20 hover:text-green-600"
                        onClick={() => updateChatTitle(chat.id, tempTitle)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-red-500/20 hover:text-red-600"
                        onClick={() => setEditingChatId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                        >
                          <MoreVertical className="h-3 w-3 " />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-gradient-to-b from-zinc-900 to-zinc-800 ">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingChatId(chat.id);
                            setTempTitle(chat.title);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteChat(chat.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-sidebar-accent/30">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-600 text-xs font-medium text-white">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full bg-gradient-to-b from-zinc-800 to-zinc-900 text-gray-300  justify-start border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-200"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};