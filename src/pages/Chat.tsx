import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageInput } from '@/components/chat/MessageInput';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile by default, always visible on desktop */}
      <div className={`
        fixed md:relative h-full z-50
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 bg-gradient-to-b from-zinc-800 to-zinc-900' : '-translate-x-full md:translate-x-0'}
      `}>
        <ChatSidebar />
      </div>
      
      <div className="flex flex-1 flex-col">
        {/* Hamburger menu - only visible on mobile */}
        <div className="md:hidden border-b border-border/50 bg-gradient-to-b from-zinc-800 to-zinc-950 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="m-2"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
        <MessageInput />
      </div>
    </div>
  );
};

export default Chat;
